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


  public funFacts: string[] = [
    "Learning a new skill just 15 minutes a day can make you an expert in a year.",
    "Teaching others is one of the best ways to master a topic yourself.",
    "Taking short breaks while studying improves memory and focus.",
    "Writing code regularly—even small projects—builds real confidence.",
    "Most people underestimate how much they can learn in a month of daily practice.",
    "Creativity grows when you combine skills from different fields.",
    "Explaining a concept out loud (even to yourself) helps you understand it better.",
    "You don’t need talent to get started—just consistency and curiosity!"
  ];
  public randomFact: string = '';

  public quotes: string[] = [
    "The best way to get started is to quit talking and begin doing.",
    "Success is not in what you have, but who you are.",
    "Dream bigger. Do bigger.",
    "Don’t watch the clock; do what it does. Keep going.",
    "Great things never come from comfort zones.",
    "Push yourself, because no one else is going to do it for you."
  ];
  public randomQuote: string = '';


  
  private router = inject(Router);
  public authService = inject(AuthService);
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
  const userData = this.authService.currentUser();
  
  if (userData && userData.userId) {
    // אנחנו מבקשים מהשרת את המידע המלא על המשתמש
    this.userService.getCurrentUserProfile(userData.userId).subscribe({
      next: (fullUser) => {
        // אנחנו מעדכנים את ה-AuthService עם המידע האמיתי מה-DB
        this.authService.updateCurrentUser(fullUser);
        // ואז מעדכנים את המסך
        this.updateUIFromUserDto(fullUser);
      }
    });
  }
  const loggedInUser = this.authService.currentUser();

  if (loggedInUser) {
    this.updateUIFromUserDto(loggedInUser);
    this.editedBio = loggedInUser.bio || this.user().bio;
    this.editedName = loggedInUser.username || this.user().name;
    this.editedTitle = loggedInUser.title || this.user().title;
    this.editedLocation = loggedInUser.location || this.user().location;
    this.randomFact = this.funFacts[Math.floor(Math.random() * this.funFacts.length)];
    this.randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
  }
}


private updateUIFromUserDto(userData: UserDTO) {
    // בדיקה איזה שדה מכיל את הנתיב
    const cleanPath = userData.userAvatarUrl || userData.avatarUrl; 
    
    let finalAvatarUrl = INITIAL_USER_DATA.avatarUrl; // ברירת מחדל (הסגול)
    
    // רק אם יש נתיב והוא לא null, ננסה לבנות כתובת מלאה
    if (cleanPath && typeof cleanPath === 'string' && cleanPath !== 'null') {
        if (!cleanPath.startsWith('http')) {
            finalAvatarUrl = `http://localhost:8080/api/files/${cleanPath}`;
        } else {
            finalAvatarUrl = cleanPath;
        }
    }

    this.user.set({
        ...this.user(),
        name: userData.username || 'User',
        avatarUrl: finalAvatarUrl // כאן מוזרקת התמונה
    });
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


onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            const userDto = this.authService.currentUser();
            console.log('Current user data from AuthService:', userDto); 
            const userId = userDto?.userId;
            
            if (!userId) {
                console.error("User ID not found, cannot upload avatar.");
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file, file.name); 
            
            console.log("Sending avatar upload request to backend...");

  this.userService.uploadAvatar(userId, formData).subscribe({
    next: (response: any) => { 
        const currentDto = this.authService.currentUser();
        
        if (currentDto) {
            const newPath = response.userAvatarUrl || response.avatarUrl || response.path; 
    
            const updatedDto: UserDTO = {
                ...currentDto,
                userAvatarUrl: newPath, 
                avatarUrl: newPath, 
            };
            
            this.authService.updateCurrentUser(updatedDto); 
            
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
  const currentUser = this.authService.currentUser();
  if (this.isOwner() && currentUser?.userId) {
    const updatedData = {
      username: this.editedName,
      title: this.editedTitle,
      location: this.editedLocation,
      bio: this.user().bio, 
      email: currentUser.email 
    };

    this.userService.updateUser(currentUser.userId, updatedData).subscribe({
      next: (response: UserDTO) => {
        this.user.update(currentProfile => ({
          ...currentProfile,
          name: response.username || this.editedName,
          title: response.title || this.editedTitle,
          location: response.location || this.editedLocation,
        }));
       this.authService.updateCurrentUser({ ...currentUser, username: this.editedName });
        
        this.isEditingProfile.set(false);
        console.log('Profile saved successfully in DB');
      },
      error: (err) => {
        console.error('Update failed:', err);
        alert('Error in saving the data in the server');
      }
    });
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
  const currentUser = this.authService.currentUser();
  if (this.isOwner() && currentUser?.userId) {
    
    const updatedData = {
      bio: this.editedBio,
      username: this.user().name,
      title: this.user().title,
      location: this.user().location,
      email: currentUser.email
    };

    this.userService.updateUser(currentUser.userId, updatedData).subscribe({
      next: (response: UserDTO) => {
        this.user.update(currentProfile => ({
          ...currentProfile,
          bio: response.bio || this.editedBio
        }));
        this.isEditingAbout.set(false);
        console.log('Bio saved successfully in DB');
      },
      error: (err) => console.error('Failed to update bio:', err)
    });
  }
}

  cancelEditAbout(): void {
      this.editedBio = this.user().bio;
      this.isEditingAbout.set(false);
  }
}