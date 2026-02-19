import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../service/api.service';
import { AuthService } from '../service/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDTO } from '../service/models/auth.model'; 

@Component({
  selector: 'app-posts-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './category-posts.component.html',
  styleUrls: ['./category-posts.component.css']
})

export class CategoryPostsComponent implements OnInit {
  categoryId: string | null = null;
  categoryName: string = '';
  posts: any[] = [];
  private allCategories: any[] = [];
 
  isAvatarMenuOpen = false;

  postTitle = '';
  postBody = ''; 
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  previewType: string | null = null;

  isEditMode = false;
  editingPostId: number | null = null; 

  showCommentsForPost: number | null = null;
  newCommentsInput: { [postId: number]: string } = {};
  
  showDeletePostModal = false;
  pendingDeletePostId: number | null = null;
  deleteErrorMessage: string | null = null; 

  portraitMode = true;

  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.loadPosts();
    this.loadAllCategories();
  }
  
    user() {
        return this.authService.getCurrentUserData();
    }

  togglePortrait() {
    this.portraitMode = !this.portraitMode;
  }

loadAllCategories() {
    this.api.getCategories().subscribe({ 
      next: (cats: any[]) => {
        this.allCategories = cats || [];
        console.log('All Categories loaded for lookup:', this.allCategories);
        this.setCategoryNameFromApi(); 
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }



  setCategoryNameFromApi() {
    if (!this.categoryId) {
      this.categoryName = 'All Posts';
      return;
    }
    
    const catIdNumber = Number(this.categoryId);
    
    const foundCategory = this.allCategories.find(c => c.categoryId === catIdNumber);
    
    if (foundCategory) {
      this.categoryName = foundCategory.categoryName;
    } else {
      this.categoryName = `Category #${this.categoryId}`; 
    }
    
    console.log(`Category Name set dynamically to: ${this.categoryName}`);
  }


  loadPosts() {
    if (this.categoryId) {
      this.api.getPostsByCategory(this.categoryId).subscribe(
        (list: any) => {
          this.posts = list || [];
          console.log(`Posts loaded successfully (${this.posts.length} items):`, this.posts); 
        }
      );
    }
  }

  toggleAvatarMenu() {
    this.isAvatarMenuOpen = !this.isAvatarMenuOpen;
  }

  navigateToProfile(): void {
    this.isAvatarMenuOpen = false; 
    this.router.navigate(['/profile']); 
}
  signOut() {
    this.authService.logout();
    this.router.navigate(['/sign-in']);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;
    const f = input.files[0];
    this.selectedFile = f;
    this.previewType = f.type;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result as string;
    reader.readAsDataURL(f);
  }

  clearForm() {
    this.postTitle = '';
    this.postBody = '';
    this.selectedFile = null;
    this.previewUrl = null;
    this.previewType = null;
    this.isEditMode = false;
    this.editingPostId = null;
  }

   submitPost() {
    if (!this.postTitle.trim() || !this.categoryId) return;
    const currentUser = this.authService.getCurrentUserData();
    if (!currentUser || !currentUser.userId) {
        console.error("User not authenticated or missing userId.");
        return;
    }

    const skillDTO = {
      title: this.postTitle.trim(),
      description: this.postBody.trim(),
      mediaUrl: '', 
      categoryId: Number(this.categoryId), 
      userId: currentUser.userId 
    };

    const formData = new FormData();

    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    } 

    const skillBlob = new Blob([JSON.stringify(skillDTO)], {
        type: 'application/json'
    });
    
    formData.append('skill', skillBlob, 'skill.json'); 

    if (this.isEditMode && this.editingPostId !== null) {
      const payload = this.selectedFile ? formData : skillDTO; 

      this.api.updatePost(this.editingPostId, payload).subscribe({
        next: (updatedPost: any) => {
          this.loadPosts(); 
          this.clearForm();
        },
        error: (err) => {
          console.error('Error updating post:', err);
        }
      });
    } else {
      this.api.createPost(formData).subscribe({
        next: (newPost: any) => {
          console.log('Post created successfully:', newPost);
          this.clearForm();
          this.loadPosts(); 
        },
        error: (err) => {
          console.error('Error creating post:', err); 
        }
      });
    }
  }

  editPost(post: any) {
    this.isEditMode = true;
    this.editingPostId = post.skillId; 
    this.postTitle = post.title;
    this.postBody = post.description; 
    this.previewUrl = post.media;
    this.previewType = post.mediaType;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  requestDeletePost(postId: number | null, event?: Event) {
    if (event) event.stopPropagation();
    this.pendingDeletePostId = postId;
    this.deleteErrorMessage = null; 
    this.showDeletePostModal = true;
  }

  cancelDeletePost() {
    this.showDeletePostModal = false;
    this.pendingDeletePostId = null;
    this.deleteErrorMessage = null;
  }

  deletePost(postId: number | null) {
    if(!postId) return
    this.api.deletePost(postId).subscribe({
      next: () => {
        const index = this.posts.findIndex(p => p.skillId === postId); 
        if (index > -1) {
          this.posts.splice(index, 1);
        }
        console.log(`Post ${postId} deleted successfully!`);
        this.cancelDeletePost();
      },
      error: (err) => {
        console.error('Error deleting post:', err);
        this.deleteErrorMessage = 'Failed to delete post.'; 
      }
    });
  }

isPostOwner(post: any): boolean {
    const currentUser = this.authService.getCurrentUserData();
    
    if (!currentUser) return false;
    const currentUsername = currentUser.username?.toLowerCase(); 
    const postAuthorName = post.username?.toLowerCase(); 

    const isMatch = currentUsername === postAuthorName;
    console.group(`Post ID: ${post.skillId}`);
    console.log(`Current User Username: ${currentUsername}`);
    console.log(`Post Author Username (p.username): ${postAuthorName}`); 
    console.log(`Match Result: ${isMatch}`);
    console.groupEnd();

    return isMatch;
}

isPostLiked(post: any): boolean {
    const localState = this.readLikeStateMap()[post.skillId];
    if (typeof localState === 'boolean') {
        return localState;
    }

    const currentUser = this.authService.getCurrentUserData() as any;
    const userId = currentUser?.userId ?? currentUser?.id;
    const likedBy = post?.likedBy ?? [];

    if (!userId || !Array.isArray(likedBy)) return false;

    return likedBy.map((value: any) => String(value)).includes(String(userId));
}

private getLikeStateStorageKey(): string {
    const currentUser = this.authService.getCurrentUserData() as any;
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


  likePost(post: any) {
    const previousState = this.isPostLiked(post);
    const currentUser = this.authService.getCurrentUserData();
    const userId = currentUser?.userId;

    if (!userId) {
        console.warn('User not logged in');
        return;
    }
    this.api.likePost(post.skillId, userId).subscribe({ 
      next: (updated: any) => { 
        const index = this.posts.findIndex(p => p.skillId === post.skillId); 
        if (index > -1) {
          this.posts[index] = updated; 
        }

                this.writeLikeState(post.skillId, !previousState);
      },
      error: (err) => console.error('Error liking post:', err)
    });
}


toggleComments(postId: number) {
    this.showCommentsForPost = this.showCommentsForPost === postId ? null : postId;
    if (this.showCommentsForPost === postId) {
        this.newCommentsInput[postId] = ''; 
    }
}


addComment(post: any) {
    const commentText = this.newCommentsInput[post.skillId];
    if (!commentText || !commentText.trim()) return;

    const currentUser = this.authService.getCurrentUserData();
    if (!currentUser || !currentUser.userId) {
        console.error('User not authenticated or missing userId.');
        return;
    }

    const commentRequest = {
        userId: currentUser.userId, 
        content: commentText.trim(),
        skillId: post.skillId 
    };

    this.api.addComment(post.skillId, commentRequest).subscribe({
        next: (updatedSkill: any) => {
            const index = this.posts.findIndex(p => p.skillId === post.skillId);
            if (index > -1) {
                this.posts[index] = updatedSkill;
            }
            this.newCommentsInput[post.skillId] = '';
        },
        error: (err) => {
            console.error('Error adding comment:', err);
        }
    });
}

  cancelEdit() {
    this.isEditMode = false;
    this.editingPostId = null;
    this.clearForm();
  }



isMediaVideo(mediaPath: string): boolean {
    if (!mediaPath) return false;
    const lowerCasePath = mediaPath.toLowerCase();
    return lowerCasePath.endsWith('.mp4') || 
           lowerCasePath.endsWith('.mov') || 
           lowerCasePath.endsWith('.webm');
}


isMediaImage(mediaPath: string): boolean {
    if (!mediaPath) return false;
    const lowerCasePath = mediaPath.toLowerCase();
    return lowerCasePath.endsWith('.jpg') || 
           lowerCasePath.endsWith('.jpeg') || 
           lowerCasePath.endsWith('.png') || 
           lowerCasePath.endsWith('.webp');
}

isMediaAudio(mediaPath: string): boolean {
    if (!mediaPath) return false;
    const lowerCasePath = mediaPath.toLowerCase();
    return lowerCasePath.endsWith('.mp3') || 
           lowerCasePath.endsWith('.wav') || 
           lowerCasePath.endsWith('.ogg');
}


}