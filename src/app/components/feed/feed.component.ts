import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { ApiService } from '../../service/api.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface Post {
    skillId: number;
    title: string;
    description: string;
    username: string; 
    userAvatarUrl: string; 
    categoryId: number;
    categoryName: string; 
    likesCount: number;
    comments: any[];
    imagePath?: string; 
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

    readonly FILE_SERVER_BASE_URL = 'http://localhost:8080/api/files/'; 
    
    allPosts = signal<Post[]>([]);
    categories = signal<any[]>([]);
    isAvatarMenuOpen = signal<boolean>(false);
    isMobileMenuOpen = signal<boolean>(false);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    search = signal<string>('');
    selectedCategoryId = signal<number | 'all'>('all');
    sortMode = signal<'top' | 'likes' | 'comments' | 'new'>('top');
    
    private router = inject(Router);
    public authService = inject(AuthService);
    private apiService = inject(ApiService);
    private sanitizer = inject(DomSanitizer);
    
    
    isPostVideo(post: any): boolean {
        if (post.mediaType?.startsWith('video')) return true;
        if (post.imagePath) {
            const lowerCasePath = post.imagePath.toLowerCase();
            return lowerCasePath.endsWith('.mp4') || 
                   lowerCasePath.endsWith('.mov') || 
                   lowerCasePath.endsWith('.webm');
        }
        return false;
    }

    isPostAudio(post: any): boolean {
        if (post.mediaType?.startsWith('audio')) return true;
        if (post.imagePath) {
            const lowerCasePath = post.imagePath.toLowerCase();
            return lowerCasePath.endsWith('.mp3') || 
                   lowerCasePath.endsWith('.wav') || 
                   lowerCasePath.endsWith('.ogg');
        }
        return false;
    }


    getSafeMediaUrl(fileName: string | undefined): SafeUrl | string {
        if (!fileName) {
            return '';
        }
        const fullUrl = this.FILE_SERVER_BASE_URL + fileName;
        return this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl); 
    }


    filteredPosts = computed(() => {
        const q = this.search().toLowerCase().trim();
        const cat = this.selectedCategoryId();
        const mode = this.sortMode();

        let list = this.allPosts().slice();

        if (cat !== 'all') {
            list = list.filter(p => p.categoryId === cat);
        }

        if (q) {
            list = list.filter(p =>
                (p.title || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
        }

        const enriched = list.map(p => ({
            ...p,
            engagement: (p.likesCount || 0) + (p.comments?.length || 0)
        }));

        enriched.sort((a, b) => {
            switch (mode) {
                case 'likes':
                    return (b.likesCount || 0) - (a.likesCount || 0);
                case 'comments':
                    return (b.comments?.length || 0) - (a.comments?.length || 0);
                case 'new':
                    return (b.skillId || 0) - (a.skillId || 0);
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
  
    getMediaUrl(fileName: string | undefined): string {
        if (!fileName) {
            return '';
        }
        const fullUrl = this.FILE_SERVER_BASE_URL + fileName;
        console.log('Final Avatar URL:', fullUrl); 
        
        return fullUrl;
    }


    loadAllPosts(): void {
        this.isLoading.set(true);
        this.error.set(null);
        this.apiService.getAllPosts().subscribe({
            next: (posts) => {
                console.log('Post Data Structure Example:', posts[0]); 
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
        next: (cats) => {
            console.log('Categories Loaded:', cats); 
            this.categories.set(cats || []);
        },
        error: (err) => {
            console.error('ERROR loading categories from API:', err);
            this.error.set('Failed to load categories for filter.');
        }
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

    private getLikeStateStorageKey(): string {
        const currentUser = this.authService.currentUser() as any;
        const userId = currentUser?.userId ?? currentUser?.id ?? 'guest';
        return `fynx-like-state-${userId}`;
    }

    private readLikeStateMap(): Record<number, boolean> {
        if (typeof localStorage === 'undefined') return {};
        const raw = localStorage.getItem(this.getLikeStateStorageKey());
        if (!raw) return {};

        try {
            return JSON.parse(raw) as Record<number, boolean>;
        } catch {
            return {};
        }
    }

    private writeLikeState(skillId: number, isLiked: boolean): void {
        if (typeof localStorage === 'undefined') return;
        const map = this.readLikeStateMap();
        map[skillId] = isLiked;
        localStorage.setItem(this.getLikeStateStorageKey(), JSON.stringify(map));
    }

    isPostLiked(post: Post): boolean {
        const localState = this.readLikeStateMap()[post.skillId];
        if (typeof localState === 'boolean') {
            return localState;
        }

        const currentUser = this.authService.currentUser() as any;
        const userId = currentUser?.userId ?? currentUser?.id;
        const likedBy = post?.likedBy ?? [];

        if (!userId || !Array.isArray(likedBy)) {
            return false;
        }

        return likedBy.map(v => String(v)).includes(String(userId));
    }

   likePost(post: any): void {
    const previousState = this.isPostLiked(post);
    const currentUser = this.authService.currentUser();
    
    const userId = (currentUser as any)?.userId || (currentUser as any)?.id;

    if (!userId) {
        console.warn('User must be logged in to like posts');
        return;
    }

    this.apiService.likePost(post.skillId, userId).subscribe({
        next: (savedPost: any) => {
            const current = this.allPosts().slice();
            const idx = current.findIndex(p => p.skillId === post.skillId);
            
            if (idx > -1) {
                current[idx] = savedPost; 
                this.allPosts.set(current); 
            }

            this.writeLikeState(post.skillId, !previousState);
        },
        error: (err) => {
            console.error('Error toggling like:', err);
        }
    });
}

    signOut(): void {
        console.log('User signed out');
        this.authService.logout();
        this.isAvatarMenuOpen.set(false);
        this.router.navigate(['/sign-in']);
    }

    user() {
        return this.authService.currentUser();
    }
}