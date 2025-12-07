import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; 
import { AuthService } from '../../service/auth.service';
import { UserDTO } from '../../service/models/auth.model'; 
import { UserService } from '../../service/user.service';

interface UserProfile {
  name: string; 
  title: string; 
  bio: string; 
  avatarUrl: string; 
  location: string;       
}

const INITIAL_USER_DATA: UserProfile = {
  name: "User Name From Signup", 
  title: "Full Stack Developer", 
  bio: "Experienced developer focused on crafting clean, efficient, and user-centric applications.", 
  avatarUrl: "https://placehold.co/130x130/8e44ad/ffffff?text=NP",
  location: "Tel Aviv, Israel"
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, FormsModule], 
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  
  user = signal<UserProfile>(INITIAL_USER_DATA); 
  
  private router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService); 
  private _isOwner = signal<boolean>(true); 
  
  isAvatarMenuOpen = signal<boolean>(false); 
  
  isEditingAbout = signal<boolean>(false);
  editedBio: string = ''; 

  isEditingProfile = signal<boolean>(false);
  editedName: string = '';
  editedTitle: string = '';
  editedLocation: string = '';
  
  ngOnInit() {
    this.loadUserProfile();
    this.editedBio = this.user().bio;
    this.editedName = this.user().name;
    this.editedTitle = this.user().title;
    this.editedLocation = this.user().location;
  }



// 🚨 פונקציית הטעינה המתוקנת: משתמשת ב-avatarUrl שנשמר ב-DTO
// בתוך profile.component.ts

// 💡 בתוך profile.component.ts - במקום הפונקציה loadUserProfile הנוכחית

loadUserProfile() {
    const userData: UserDTO | null = this.authService.currentUser();
    
    console.log('Auth user data:', userData);
    
    if (userData && userData.userId) {
        
        // 🚨 הסר את ה-subscribe/error block
        // בצע את הקריאה ל-API, אבל אל תטפל בשגיאה כאן.
        // ה-AuthInterceptor יתפוס את שגיאת 401 וינתק את המשתמש.
        
        this.userService.getCurrentUserProfile(userData.userId).subscribe({
            next: (fullUserDto: UserDTO) => {
                // הצלחה: השרת אישר את הסשן והחזיר DTO מלא
                this.authService.updateCurrentUser(fullUserDto); 
                this.updateUIFromUserDto(fullUserDto);
            },
            error: (err) => {
                // אם הקריאה נכשלה (401), האינטרספטור כבר ניתק אותנו.
                // נטפל בשגיאות אחרות או נסמוך על האינטרספטור.
                
                // 🚨 אם זה לא 401, נטפל בזה. אם זה 401, אין צורך
                if (err.status !== 401) {
                    this.updateUIFromUserDto(userData); // נשתמש בנתונים השבורים מה-localStorage בינתיים
                }
            }
        });
        
    } else {
        console.log('No user logged in, using demo profile data');
        this.user.set(INITIAL_USER_DATA); 
    }
}

// 💡 פונקציה חדשה שהופרדה לטובת עדכון ה-UI
private updateUIFromUserDto(userData: UserDTO) {
    const cleanPath = userData.userAvatarUrl || userData.avatarUrl; 
    let finalAvatarUrl = INITIAL_USER_DATA.avatarUrl; 
    
    if (cleanPath && typeof cleanPath === 'string') {
        if (!cleanPath.startsWith('http') && cleanPath.includes('.')) {
            finalAvatarUrl = `http://localhost:8080/api/files/${cleanPath}`;
        } else {
            finalAvatarUrl = cleanPath;
        }
    }
    
    this.user.update(profile => ({
        ...profile,
        name: userData.username,
        avatarUrl: finalAvatarUrl
    }));
    console.log('Updated profile with full avatar URL:', finalAvatarUrl);
}

  isOwner(): boolean {
      return this._isOwner();
  }
  
  toggleAvatarMenu(): void {
    this.isAvatarMenuOpen.update(value => !value);
  }

  signOut(): void {
    console.log('User signed out');
    this.authService.logout();
    this.isAvatarMenuOpen.set(false); 
    this.router.navigate(['/sign-in']); 
  }
// בקובץ profile.component.ts

// בקובץ profile.component.ts - הפונקציה onFileSelected המלאה והמתוקנת

onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // 🚨 תיקון 1: חילוץ userId
            const userDto = this.authService.currentUser();
            const userId = userDto?.userId;
            
            if (!userId) {
                console.error("User ID not found, cannot upload avatar.");
                return;
            }
            
            // 1. הכנת ה-FormData
            const formData = new FormData();
            formData.append('file', file, file.name); // 🚨 ודא שזה קיים
            
            console.log("Sending avatar upload request to backend...");

  this.userService.uploadAvatar(userId, formData).subscribe({
    next: (response: any) => { // מקבלים את תגובת השרת (כנראה רק הנתיב החדש)
        
        // 1. קרא את הנתונים המלאים הקיימים (מה-localStorage)
        const currentDto = this.authService.currentUser();
        
        if (currentDto) {
            // חלץ את הנתיב החדש מכל שדה שהשרת החזיר
            const newPath = response.userAvatarUrl || response.avatarUrl || response.path; 
            
            // 2. מיזוג: צור DTO חדש המשלב את הישן והנתיב החדש
            const updatedDto: UserDTO = {
                ...currentDto,
                // אנו דורסים את הנתיב הישן בשני השדות כדי לשמור על עקביות
                userAvatarUrl: newPath, 
                avatarUrl: newPath, // אם השרת החזיר נתיב חדש
            };
            
            // 3. שמירה: שולח את ה-DTO המלא והמעודכן ל-AuthService כדי שיישמר ב-localStorage
            this.authService.updateCurrentUser(updatedDto); 
            
            // 4. ריענון ה-UI
            this.loadUserProfile(); 
            
            console.log('Avatar successfully uploaded, DTO merged and saved.');
            alert('Profile picture updated successfully!');
        } else {
            console.error("User DTO not found for update, cannot save new avatar.");
        }
    },
    error: (err) => {
        console.error('Avatar upload failed:', err);
        alert(`Failed to upload avatar. Check console for details.`);
    }
});
        }
    }

  toggleEditProfile(): void {
    if (this.isOwner()) {
        if (!this.isEditingProfile()) {
            this.editedName = this.user().name;
            this.editedTitle = this.user().title;
            this.editedLocation = this.user().location;
        }
        this.isEditingProfile.update(value => !value);
    }
  }

  saveProfileDetails(): void {
    if (this.isOwner()) {
        this.user.update(currentProfile => ({
            ...currentProfile,
            name: this.editedName,
            title: this.editedTitle,
            location: this.editedLocation,
        }));
        this.isEditingProfile.set(false);
    }
  }

  cancelEditProfile(): void {
      this.editedName = this.user().name;
      this.editedTitle = this.user().title;
      this.editedLocation = this.user().location;
      this.isEditingProfile.set(false);
  }

  toggleEditAbout(): void {
      if (this.isOwner()) {
          if (!this.isEditingAbout()) {
              this.editedBio = this.user().bio; 
          }
          this.isEditingAbout.update(value => !value);
      }
  }

  saveBio(): void {
      if (this.isOwner()) {
          this.user.update(currentProfile => ({
              ...currentProfile,
              bio: this.editedBio
          }));
          this.isEditingAbout.set(false);
      }
  }

  cancelEditAbout(): void {
      this.editedBio = this.user().bio;
      this.isEditingAbout.set(false);
  }
}