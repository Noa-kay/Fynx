import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { ApiService } from '../../service/api.service';

interface Post {
    id: number;
    title: string;
    body: string;
    author: string;
    authorAvatar?: string;
    categoryId: number;
    likes: number;
    comments: any[];
    media?: string;
  mediaType?: string;
    likedBy?: string[];
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, NgFor, RouterModule, FormsModule],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css'],
})
export class FeedComponent implements OnInit {
  
  allPosts = signal<Post[]>([]);
  categories = signal<any[]>([]);
  isAvatarMenuOpen = signal<boolean>(false);
  isMobileMenuOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Filters
  search = signal<string>('');
  selectedCategoryId = signal<number | 'all'>('all');
  sortMode = signal<'top' | 'likes' | 'comments' | 'new'>('top');
  
  private router = inject(Router);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  // Computed: filtered and sorted posts based on UI controls
  filteredPosts = computed(() => {
    const q = this.search().toLowerCase().trim();
    const cat = this.selectedCategoryId();
    const mode = this.sortMode();

    let list = this.allPosts().slice();

    // Filter by category
    if (cat !== 'all') {
      list = list.filter(p => p.categoryId === cat);
    }

    // Search by title/content
    if (q) {
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.body || '').toLowerCase().includes(q)
      );
    }

    // Enrich with engagement
    const enriched = list.map(p => ({
      ...p,
      engagement: (p.likes || 0) + (p.comments?.length || 0)
    }));

    // Sort
    enriched.sort((a, b) => {
      switch (mode) {
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        case 'comments':
          return (b.comments?.length || 0) - (a.comments?.length || 0);
        case 'new':
          // Fallback: no createdAt in schema; keep stable order
          return (b.id || 0) - (a.id || 0);
        case 'top':
        default:
          return (b.engagement || 0) - (a.engagement || 0);
      }
    });

    return enriched;
  });

  ngOnInit(): void {
    this.loadAllPosts();
    this.loadCategories();
  }

  loadAllPosts(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.apiService.getAllPosts().subscribe({
      next: (posts) => {
        this.allPosts.set(posts);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.error.set('Failed to load posts');
        this.isLoading.set(false);
      }
    });
  }
  
  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats || []),
      error: () => {}
    });
  }
  
  goToPostCategory(post: Post): void {
    this.router.navigate(['/categories', post.categoryId]);
  }

  toggleAvatarMenu(): void {
    this.isAvatarMenuOpen.update(value => !value);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  navigateToProfile(): void {
    this.isAvatarMenuOpen.set(false);
    this.router.navigate(['/profile']);
  }

  getCategoryName(categoryId: number): string {
    const cat = this.categories().find(c => c.id === categoryId);
    return cat ? cat.name : `Category ${categoryId}`;
  }

  likePost(post: Post): void {
    const currentUser = this.authService.currentUser();
    const username = currentUser && typeof currentUser === 'object' && 'username' in currentUser 
      ? currentUser.username 
      : 'Anonymous';
    
    // Initialize likedBy array if it doesn't exist
    const likedBy = (post as any).likedBy || [];
    
    // Check if user already liked this post
    const alreadyLiked = likedBy.includes(username);
    
    let updatedLikedBy: string[];
    let updatedLikes: number;
    
    if (alreadyLiked) {
      // Unlike: remove user from likedBy array
      updatedLikedBy = likedBy.filter((user: string) => user !== username);
      updatedLikes = Math.max(0, (post.likes || 0) - 1);
    } else {
      // Like: add user to likedBy array
      updatedLikedBy = [...likedBy, username];
      updatedLikes = (post.likes || 0) + 1;
    }
    
    const updated = { 
      ...post, 
      likes: updatedLikes,
      likedBy: updatedLikedBy
    } as any;
    
    this.apiService.updatePost(post.id, updated).subscribe({
      next: (saved: any) => {
        // Update local copy
        const current = this.allPosts().slice();
        const idx = current.findIndex(p => p.id === post.id);
        if (idx > -1) current[idx] = saved;
        this.allPosts.set(current);
      },
      error: (err) => console.error('Error liking post:', err)
    });
  }

  signOut(): void {
    console.log('User signed out');
    this.authService.logout();
    this.isAvatarMenuOpen.set(false);
    this.router.navigate(['/sign-in']);
  }
}