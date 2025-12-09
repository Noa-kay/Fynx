import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { ApiService } from '../../service/api.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface Post {
    id: number;
    title: string;
    description: string;
    username: string; 
    userAvatarUrl: string; 
    categoryId: number;
    categoryName: string; 
    likes: number;
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

    // [תיקון 1] הגדרת קבוע Base URL לשרת הקבצים
    readonly FILE_SERVER_BASE_URL = 'http://localhost:8080/api/files/'; 
    
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
    private sanitizer = inject(DomSanitizer);
    
    
    isPostVideo(post: any): boolean {
        // אם mediaType קיים ומתחיל ב-'video' - השתמש בו
        if (post.mediaType?.startsWith('video')) return true;

        // אם mediaType חסר, השתמש בזיהוי לפי סיומת הקובץ
        if (post.imagePath) {
            const lowerCasePath = post.imagePath.toLowerCase();
            return lowerCasePath.endsWith('.mp4') || 
                   lowerCasePath.endsWith('.mov') || 
                   lowerCasePath.endsWith('.webm');
        }
        return false;
    }

    isPostAudio(post: any): boolean {
        // אם mediaType קיים ומציין אודיו
        if (post.mediaType?.startsWith('audio')) return true;
    
        // אם mediaType חסר, בדוק סיומת קובץ (Fallback)
        if (post.imagePath) {
            const lowerCasePath = post.imagePath.toLowerCase();
            return lowerCasePath.endsWith('.mp3') || 
                   lowerCasePath.endsWith('.wav') || 
                   lowerCasePath.endsWith('.ogg');
        }
        return false;
    }

    userHeaderAvatarUrl = computed<string | SafeUrl>(() => { // 👈 שינוי כאן
        const user = this.authService.currentUser();
        
        const avatarPathOrPlaceholder = user && typeof user === 'object' && 'avatarUrl' in user 
            ? (user as any).avatarUrl 
            : null;

        if (!avatarPathOrPlaceholder) {
            return 'https://placehold.co/50x50/ff9933/ffffff?text=U';
        }

        if (avatarPathOrPlaceholder.startsWith('https://')) {
            return avatarPathOrPlaceholder; 
        }
        
        // 🎯 שינוי קריטי: הכרזה על ה-URL כבטוחה
        const rawUrl = this.getMediaUrl(avatarPathOrPlaceholder);
        return this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    });

    getSafeMediaUrl(fileName: string | undefined): SafeUrl | string {
        if (!fileName) {
            return '';
        }
        const fullUrl = this.FILE_SERVER_BASE_URL + fileName;
        // הכרזה על ה-URL כבטוח
        return this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl); 
    }


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
                (p.description || '').toLowerCase().includes(q)
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
    
    // [תיקון 3] פונקציה לבניית ה-URL המלא לקובץ
    getMediaUrl(fileName: string | undefined): string {
        if (!fileName) {
            return '';
        }
        const fullUrl = this.FILE_SERVER_BASE_URL + fileName;
        
        // 👈 הוסף את ההדפסה הזו
        console.log('Final Avatar URL:', fullUrl); 
        
        return fullUrl;
    }


    loadAllPosts(): void {
        this.isLoading.set(true);
        this.error.set(null);
        this.apiService.getAllPosts().subscribe({
            next: (posts) => {
                // 👈 הדפס את הפוסט הראשון שקיבלת מהשרת
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
            console.log('Categories Loaded:', cats); // בדוק את מבנה הנתונים!
            this.categories.set(cats || []);
        },
        error: (err) => {
            console.error('ERROR loading categories from API:', err);
            // אפשר גם להציג שגיאה בבאנר של הפיד:
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

    likePost(post: Post): void {
        const currentUser = this.authService.currentUser();
        const username = currentUser && typeof currentUser === 'object' && 'username' in currentUser 
            ? (currentUser as any).username 
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