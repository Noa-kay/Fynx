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
  
  userAvatar: string = '';
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
    this.loadUserAvatar();
    this.loadPosts();
    this.loadAllCategories();
  }

  togglePortrait() {
    this.portraitMode = !this.portraitMode;
  }


loadUserAvatar() {
    const userData: UserDTO | null = this.authService.getCurrentUserData();
    
    if (userData) {
        // 🚨 תיקון קריטי: ניסיון לגשת לנתיב הנקי (userAvatarUrl) ואז ל-avatarUrl
        const cleanPath = userData.userAvatarUrl || userData.avatarUrl; 
        let finalAvatarUrl: string;
        
        if (cleanPath && typeof cleanPath === 'string' && !cleanPath.startsWith('http')) {
            // בניית ה-URL המלא לשרת
            finalAvatarUrl = `http://localhost:8080/api/files/${cleanPath}`;
        } else if (cleanPath) {
            // אם זה כבר URL מלא (Placeholder או URL קודם)
            finalAvatarUrl = cleanPath;
        } else {
            // ברירת מחדל אם אין תמונה כלל
            const initial = userData.username?.charAt(0).toUpperCase() || 'U';
            finalAvatarUrl = `https://placehold.co/40x40/8e44ad/ffffff?text=${initial}`;
        }
        
        this.userAvatar = finalAvatarUrl;
        console.log('Header Avatar URL set to:', this.userAvatar);
    } else {
        // אם אין משתמש מחובר
        this.userAvatar = 'https://placehold.co/40x40/8e44ad/ffffff?text=U';
    }
}


loadAllCategories() {
    this.api.getCategories().subscribe({ // נניח ש-api.getCategories קיימת
      next: (cats: any[]) => {
        this.allCategories = cats || [];
        console.log('All Categories loaded for lookup:', this.allCategories);
        
        // 🎯 3. מצא את שם הקטגוריה רק לאחר שהנתונים נטענו
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
      this.categoryName = `Category #${this.categoryId}`; // Fallback
    }
    
    console.log(`Category Name set dynamically to: ${this.categoryName}`);
  }


  loadPosts() {
    if (this.categoryId) {
      this.api.getPostsByCategory(this.categoryId).subscribe(
        (list: any) => {
          this.posts = list || [];
          // 💡 הדפסה לווידוא: כמה פוסטים נטענו?
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
    // ניקוי מצב עריכה
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

    // יצירת SkillDTO
    const skillDTO = {
      title: this.postTitle.trim(),
      description: this.postBody.trim(),
      mediaUrl: '', 
      
      // 🛑 אלו הם השדות היחידים שצריכים להיות:
      categoryId: Number(this.categoryId), 
      userId: currentUser.userId 
    };

    const formData = new FormData();

    // 1. הוספת הקובץ (image)
    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    } 

    // 2. תיקון שגיאת 415: שליחת ה-DTO כ-Blob עם Content-Type מפורש
    const skillBlob = new Blob([JSON.stringify(skillDTO)], {
        type: 'application/json'
    });
    
    formData.append('skill', skillBlob, 'skill.json'); 

    if (this.isEditMode && this.editingPostId !== null) {
      // 🚨 תיקון: אם יש קובץ, נשתמש ב-FormData, אחרת נשלח JSON רגיל
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

  requestDeletePost(postId: number, event?: Event) {
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

  deletePost(postId: number) {
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

  likePost(post: any) {
    const currentUser = this.authService.getCurrentUserData();
    const username = currentUser?.username || 'Anonymous';
    
    // Initialize likedBy array if it doesn't exist
    const likedBy = post.likedBy || [];
    
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
    
    const updatedPost = { 
      ...post, 
      likes: updatedLikes,
      likedBy: updatedLikedBy
    };
    
 
    this.api.updatePost(post.skillId, updatedPost).subscribe({
      next: (updated: any) => {
        const index = this.posts.findIndex(p => p.skillId === post.skillId); 
        if (index > -1) {
          this.posts[index] = updated;
        }
      },
      error: (err) => {
        console.error('Error liking post:', err);
      }
    });
  }

  // בתוך CategoryPostsComponent
toggleComments(postId: number) {
    this.showCommentsForPost = this.showCommentsForPost === postId ? null : postId;
    
    // 💡 תיקון: אם פותחים את התיבה, ודא שהקלט עבור הפוסט הזה מאופס.
    if (this.showCommentsForPost === postId) {
        this.newCommentsInput[postId] = ''; 
    }
}

  // בתוך CategoryPostsComponent
// בתוך CategoryPostsComponent.ts

addComment(post: any) {
    // 1. קריאת טקסט התגובה
    const commentText = this.newCommentsInput[post.skillId];
    if (!commentText || !commentText.trim()) return;

    const currentUser = this.authService.getCurrentUserData();
    const comment = {
        // ודא שאתה משתמש ב-'username' אם ה-Backend דורש זאת, או 'user' כפי שהיה קודם
        user: currentUser?.username || 'Anonymous', 
        text: commentText.trim(),
        date: new Date().toISOString()
    };

    const comments = post.comments || [];
    comments.push(comment);

    // 2. יצירת אובייקט העדכון
    const updatedPostDTO = { 
        ...post, 
        comments,
        // ודא שאתה שולח רק שדות שהשרת באמת צריך לעדכן
        title: post.title,
        description: post.description,
        categoryId: post.categoryId,
        userId: post.userId,
        mediaUrl: post.mediaUrl || '',
        // ייתכן שתצטרך לשלוח את כל השדות החשובים של הפוסט
    };

    // 3. 🛑 יצירת FormData (התיקון לשגיאת 415)
    const formData = new FormData();

    const skillBlob = new Blob([JSON.stringify(updatedPostDTO)], {
        type: 'application/json'
    });
    
    // הוספת ה-JSON כחלק מ-FormData
    formData.append('skill', skillBlob, 'skill.json'); 
    // אין צורך לצרף קובץ כי אנחנו רק מוסיפים תגובה

    // 4. שליחה לשרת
    // הערה: יש לוודא ש-this.api.updatePost() מקבלת גם FormData
    this.api.updatePost(post.skillId, formData).subscribe({
        next: (updated: any) => {
            const index = this.posts.findIndex(p => p.skillId === post.skillId); 
            if (index > -1) {
                // עדכון הפוסט עם הנתונים שחזרו מהשרת
                this.posts[index] = updated; 
            }
            this.newCommentsInput[post.skillId] = ''; 
        },
        error: (err) => {
            console.error('Error adding comment:', err);
            // הצגת הודעת שגיאה למשתמש
            console.error('Failed to add comment.'); 
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