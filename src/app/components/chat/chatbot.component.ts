import { signal, WritableSignal, computed, OnInit, Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service'; 
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, delay, retry, throwError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface User {
  id: string;
  name: string;
  title: string;
  location: string;
  bio: string;
  avatarUrl: string;
  topSkills: string[];
}

interface Message {
  text: string;
  role: 'user' | 'ai'; 
  name: string;
  isThinking?: boolean;
  sources?: { uri: string, title: string }[];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    HttpClientModule,
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatBotComponent implements OnInit {

  readonly API_KEY = "AIzaSyDKGgmx5uyoqzk1Ru6vFzhugZuTaA3lpkk";
  readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';

  private mockUser: User = {
    id: 'user-123',
    name: 'you', // 👈 שם המשתמש שונה ל-"you"
    title: 'Senior Developer',
    location: 'San Francisco, USA',
    bio: 'Passionate about clean code, UX design, and Angular signals.',
    avatarUrl: 'https://placehold.co/130x130/00bcd4/ffffff?text=JD',
    topSkills: ['Angular', 'TypeScript', 'Tailwind', 'Firestore'],
  };

  user: WritableSignal<User> = signal(this.mockUser);
  
  isAvatarMenuOpen: WritableSignal<boolean> = signal(false);
  isEditingAbout: WritableSignal<boolean> = signal(false);
  isEditingProfile: WritableSignal<boolean> = signal(false);
  isMobileMenuOpen: WritableSignal<boolean> = signal(false);

  editedBio: WritableSignal<string> = signal(this.user().bio);
  editedName: WritableSignal<string> = signal(this.user().name);
  editedTitle: WritableSignal<string> = signal(this.user().title);
  editedLocation: WritableSignal<string> = signal(this.user().location);

  isOwner = computed(() => this.user().id === 'user-123'); 

  messages: WritableSignal<Message[]> = signal([
    { role: 'ai', name: 'Fynx AI', text: 'Hello! I am Fynx AI, an advanced language model. How can I assist you today?' },
  ]);
  
  text: string = '';
  bubbleCount = Array(7).fill(0).map((_, i) => i);

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    console.log("Fynx AI Chat Core Logic Initialized.");
  }

  send(): void {
    if (!this.text.trim()) return;
    this.sendMessage();
  }

  isLoading(): boolean {
    const lastMessage = this.messages().slice(-1)[0];
    return lastMessage?.isThinking === true;
  }

  scrollToBottom(): void {
    console.log('Scrolling to bottom...');
  }

  trackByFn(index: number): number {
    return index;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(val => !val);
  }

  sendMessage() {
    const userText = this.text.trim();
    if (!userText) return;

    this.messages.update(m => [...m, { role: 'user', name: this.user().name, text: userText }]);
    this.text = ''; 

    this.messages.update(m => [...m, { role: 'ai', name: 'Fynx AI', text: 'Thinking...', isThinking: true }]);
    
    this.getAIReply(userText); 
    
    setTimeout(() => this.scrollToBottom(), 0); 
  }

  getAIReply(userQuery: string) {
    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: {
        parts: [{ 
            text: 'I am Fynx, a helpful and friendly AI assistant. I respond concisely and I am well-structured. I always use the first person and I answer in English.'
        }]
      },
    };

    if (!this.API_KEY) {
       console.error("API Key is missing!");
       this.messages.update(m => m.filter(msg => !msg.isThinking));
       this.messages.update(m => [...this.messages(), { 
           role: 'ai', 
           name: 'Fynx AI', 
           text: 'Error: API Key is not set.' 
       }]);
       return;
    }

    const requestUrl = `${this.API_URL}?key=${this.API_KEY}`;

    this.http.post<any>(requestUrl, payload)
      .pipe(
        retry({
          count: 3, 
          delay: (error, retryCount) => {
            const delayTime = Math.pow(2, retryCount) * 1000;
            console.warn(`Retrying in ${delayTime / 1000}s...`);
            return of(error).pipe(delay(delayTime));
          }
        }),
        catchError(error => {
          console.error('AI API Error:', error);
          this.messages.update(m => {
              const updatedMessages = m.filter(msg => !msg.isThinking);
              return [...updatedMessages, { 
                  role: 'ai', 
                  name: 'Fynx AI', 
                  text: 'A connection error occurred. Please try again later.' 
              }];
          });
          return throwError(() => new Error('API request failed'));
        })
      )
      .subscribe(response => this.processAIResponse(response));
  }

  processAIResponse(response: any) {
    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    this.messages.update(m => m.filter(msg => !msg.isThinking));

    if (!text) {
        this.messages.update(m => [...this.messages(), { 
            role: 'ai', 
            name: 'Fynx AI', 
            text: 'Sorry, I could not generate a response.' 
        }]);
        return;
    }

    let sources: { uri: string, title: string }[] = [];
    const groundingMetadata = candidate.groundingMetadata;

    if (groundingMetadata?.groundingAttributions) {
    sources = groundingMetadata.groundingAttributions
        .map((a: any) => ({
            uri: a.web?.uri,
            title: a.web?.title,
        }))
        .filter((s: { uri?: string; title?: string }): s is { uri: string; title: string } => !!s.uri && !!s.title);
}

    this.messages.update(m => [...m, { 
        role: 'ai', 
        name: 'Fynx AI', 
        text: text, 
        sources: sources.length ? sources : undefined
    }]);
  }

  goToHome() { console.log('Navigating to Home'); }
  goToSkillsCategories() { console.log('Navigating to Skills'); }
  goToAiChat() { console.log('Already at AI Chat'); }
  goToProfile() { console.log('Navigating to Profile'); }

  signOut() { 
    try { this.authService.logout(); } catch {}
    this.isAvatarMenuOpen.set(false);
    this.router.navigate(['/sign-in']);
  }

  toggleAvatarMenu() {
    this.isAvatarMenuOpen.update(v => !v);
  }

  toggleEditAbout() {
    this.editedBio.set(this.user().bio);
    this.isEditingAbout.set(true);
  }
  
  cancelEditAbout() {
    this.isEditingAbout.set(false);
  }
  
  saveBio() {
    this.user.update(u => ({ ...u, bio: this.editedBio() }));
    this.cancelEditAbout();
  }

  toggleEditProfile() {
    this.editedName.set(this.user().name);
    this.editedTitle.set(this.user().title);
    this.editedLocation.set(this.user().location);
    this.isEditingProfile.set(true);
  }
  
  cancelEditProfile() {
    this.isEditingProfile.set(false);
  }
  
  saveProfileDetails() {
    this.user.update(u => ({ 
      ...u, 
      name: this.editedName(),
      title: this.editedTitle(),
      location: this.editedLocation()
    }));
    this.cancelEditProfile();
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      console.log('File selected:', input.files[0].name);
    }
  }

  getUserAvatar(): string {
    return this.user().avatarUrl;
  }

  isAvatarMenuOpenNav(): boolean {
    return this.isAvatarMenuOpen();
  }

  toggleAvatarMenuNav() {
    this.toggleAvatarMenu();
  }

  navigateToProfile(): void {
    this.isAvatarMenuOpen.set(false);
    this.router.navigate(['/profile']);
  }

  speak(text: string) {
    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn('Speech synthesis not supported');
      return;
    }
    const isHebrew = /[\u0590-\u05FF]/.test(text);
    const preferredLang = isHebrew ? 'he-IL' : 'en-US';

    const speakWithVoice = () => {
      const voices = synth.getVoices();
      const match = voices.find(v => v.lang?.toLowerCase() === preferredLang.toLowerCase())
        || voices.find(v => isHebrew ? /he/i.test(v.lang) : /en/i.test(v.lang))
        || voices[0];

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = match?.lang || preferredLang;
      if (match) utter.voice = match;
      synth.cancel();
      synth.speak(utter);
    };

    if (synth.getVoices().length === 0) {
      const onVoicesChanged = () => {
        synth.removeEventListener('voiceschanged', onVoicesChanged as any);
        speakWithVoice();
      };
      synth.addEventListener('voiceschanged', onVoicesChanged as any);
      // Trigger voice loading
      setTimeout(() => speakWithVoice(), 300);
    } else {
      speakWithVoice();
    }
  }
}