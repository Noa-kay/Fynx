import { signal, WritableSignal, computed, OnInit, OnDestroy, Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service'; 
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, delay, retry, throwError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface User {
  id: string;
  name: string;
  title: string;
  location: string;
  bio: string;
  avatarUrl: any; 
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
export class ChatBotComponent implements OnInit, OnDestroy {

  private sanitizer = inject(DomSanitizer);
  public authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  readonly FILE_SERVER_BASE_URL = 'http://localhost:8080/api/files/';
  readonly BACKEND_CHAT_URL = 'http://localhost:8080/api/skills/chat';

  private mockUser: User = {
    id: 'user-123',
    name: 'you',
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

  isOwner = computed(() => this.user().id === 'user-123' || this.user().id !== 'user-123'); 

  messages: WritableSignal<Message[]> = signal([
    { role: 'ai', name: 'Fynx AI', text: 'Hello! I am Fynx AI, an advanced language model. How can I assist you today?' },
  ]);
  
  text: string = '';
  bubbleCount = Array(7).fill(0).map((_, i) => i);
  isRecording: WritableSignal<boolean> = signal(false);
  recordingStatus: WritableSignal<string> = signal('Voice typing is ready.');
  recordingDurationSeconds: WritableSignal<number> = signal(0);
  private speechRecognition?: any;
  private recordingIntervalId?: ReturnType<typeof setInterval>;
  private baseTextBeforeRecording: string = '';
  private finalizedTranscript: string = '';

  isVoiceRecordingSupported = computed(() => {
    const win = window as any;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  });

  voiceRecordingButtonLabel = computed(() => {
    if (!this.isVoiceRecordingSupported()) {
      return 'Voice typing is not supported in this browser';
    }
    return this.isRecording() ? 'Stop voice typing' : 'Start voice typing';
  });

  ngOnInit() {
    const loggedInUser = this.authService.currentUser(); 

    if (loggedInUser) {
      const imagePath = loggedInUser.avatarUrl || loggedInUser.userAvatarUrl;
      let finalUrl: any;

      if (imagePath && !imagePath.startsWith('http')) {
        const fullUrl = `${this.FILE_SERVER_BASE_URL}${imagePath}`;
        finalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
      } else {
        finalUrl = imagePath || 'https://placehold.co/130x130/00bcd4/ffffff?text=JD';
      }

      this.user.set({
        ...this.user(),
        id: loggedInUser.userId?.toString() || 'user-123',
        name: loggedInUser.username || 'you',
        avatarUrl: finalUrl,
        bio: loggedInUser.bio || this.user().bio,
        title: loggedInUser.title || this.user().title,
        location: loggedInUser.location || this.user().location
      });
      
      this.editedBio.set(this.user().bio);
      this.editedName.set(this.user().name);
    }
  }

  ngOnDestroy(): void {
    this.clearRecordingTimer();
    this.stopSpeechRecognition();
  }

  userHeaderAvatarUrl = computed(() => this.user().avatarUrl);

  getUserAvatar(): any {
    return this.user().avatarUrl;
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

  trackByFn(index: number): number { return index; }

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
  }

  async toggleVoiceRecording(): Promise<void> {
    if (!this.isVoiceRecordingSupported()) {
      this.recordingStatus.set('Voice typing is not supported in this browser.');
      return;
    }

    if (this.isRecording()) {
      this.stopVoiceRecording();
      return;
    }

    await this.startVoiceRecording();
  }

  private async startVoiceRecording(): Promise<void> {
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      this.recordingStatus.set('Voice typing is not supported in this browser.');
      return;
    }

    this.speechRecognition = new SpeechRecognitionCtor();
    this.speechRecognition.lang = 'he-IL';
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.baseTextBeforeRecording = this.text.trim();
    this.finalizedTranscript = '';

    this.speechRecognition.onresult = (event: any) => {
      let newlyFinalTranscript = '';
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index++) {
        const transcriptPart = event.results[index][0]?.transcript ?? '';
        if (event.results[index].isFinal) {
          newlyFinalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      const finalTextChunk = newlyFinalTranscript.trim();
      if (finalTextChunk) {
        this.finalizedTranscript = [this.finalizedTranscript, finalTextChunk].filter(Boolean).join(' ').trim();
      }

      const visibleTranscript = [this.finalizedTranscript, interimTranscript.trim()].filter(Boolean).join(' ').trim();
      this.text = [this.baseTextBeforeRecording, visibleTranscript].filter(Boolean).join(' ').trim();

      this.recordingStatus.set(interimTranscript.trim()
        ? `Listening: ${interimTranscript.trim()}`
        : 'Listening...');
    };

    this.speechRecognition.onerror = () => {
      this.isRecording.set(false);
      this.clearRecordingTimer();
      this.recordingDurationSeconds.set(0);
      this.recordingStatus.set('Voice typing failed. Please try again.');
    };

    this.speechRecognition.onend = () => {
      this.clearRecordingTimer();
      this.recordingDurationSeconds.set(0);
      this.isRecording.set(false);
      this.baseTextBeforeRecording = '';
      this.finalizedTranscript = '';
      this.recordingStatus.set('Voice typing complete. You can edit and send the text.');
      this.speechRecognition = undefined;
    };

    this.speechRecognition.start();
    this.isRecording.set(true);
    this.recordingDurationSeconds.set(0);
    this.clearRecordingTimer();
    this.recordingIntervalId = setInterval(() => {
      this.recordingDurationSeconds.update(seconds => seconds + 1);
    }, 1000);
    this.recordingStatus.set('Listening... press again to stop.');
  }

  private stopVoiceRecording(): void {
    this.clearRecordingTimer();
    this.recordingStatus.set('Stopping voice typing...');
    this.stopSpeechRecognition();
  }

  private clearRecordingTimer(): void {
    if (this.recordingIntervalId) {
      clearInterval(this.recordingIntervalId);
      this.recordingIntervalId = undefined;
    }
  }

  private stopSpeechRecognition(): void {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  getAIReply(userQuery: string) {
    const payload = {
        message: "Please answer the following in English: " + userQuery,
        userId: this.user().id, 
    };

    this.http.post<any>(this.BACKEND_CHAT_URL, payload)
      .pipe(
        retry(2),
        catchError(error => {
          this.messages.update(m => {
             const updatedMessages = m.filter(msg => !msg.isThinking);
             return [...updatedMessages, { role: 'ai', name: 'Fynx AI', text: 'A connection error occurred.' }];
          });
          return throwError(() => new Error('API request failed'));
        })
      )
      .subscribe(response => this.processAIResponse(response));
  }

  processAIResponse(response: any) {
    const text = response.response; 
    this.messages.update(m => m.filter(msg => !msg.isThinking)); 
    this.messages.update(m => [...this.messages(), { 
        role: 'ai', name: 'Fynx AI', text: text || 'Sorry, empty response.' 
    }]);
  }

  signOut(): void { 
    this.authService.logout();
    this.isAvatarMenuOpen.set(false);
    this.router.navigate(['/sign-in']);
  }

  toggleAvatarMenu(): void {
    this.isAvatarMenuOpen.update(v => !v);
  }

  toggleEditAbout(): void {
    this.editedBio.set(this.user().bio);
    this.isEditingAbout.set(true);
  }
  
  cancelEditAbout(): void {
    this.isEditingAbout.set(false);
  }
  
  saveBio(): void {
    this.user.update(u => ({ ...u, bio: this.editedBio() }));
    this.cancelEditAbout();
  }

  toggleEditProfile(): void {
    this.editedName.set(this.user().name);
    this.editedTitle.set(this.user().title);
    this.editedLocation.set(this.user().location);
    this.isEditingProfile.set(true);
  }
  
  cancelEditProfile(): void {
    this.isEditingProfile.set(false);
  }
  
  saveProfileDetails(): void {
    this.user.update(u => ({ 
      ...u, 
      name: this.editedName(),
      title: this.editedTitle(),
      location: this.editedLocation()
    }));
    this.cancelEditProfile();
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      console.log('File selected:', input.files[0].name);
    }
  }

  navigateToProfile(): void {
    this.isAvatarMenuOpen.set(false);
    this.router.navigate(['/profile']);
  }


  formatAiResponse(text: string): string {
    if (!text) return '';

    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    formatted = formatted.replace(/^\s*\*\s+(.*)/gm, '• $1');

    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

  speak(text: string): void {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const isHebrew = /[\u0590-\u05FF]/.test(text);
    const preferredLang = isHebrew ? 'he-IL' : 'en-US';

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = preferredLang;
    synth.cancel();
    synth.speak(utter);
  }
}