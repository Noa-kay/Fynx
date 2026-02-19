import { signal, WritableSignal, computed, OnInit, OnDestroy, Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service'; 
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, retry, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

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

interface ChatConversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}

type ConversationDialogMode = 'rename' | 'delete' | 'clear' | null;

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

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

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

  conversations: WritableSignal<ChatConversation[]> = signal([]);
  activeConversationId: WritableSignal<string | null> = signal(null);
  dialogMode: WritableSignal<ConversationDialogMode> = signal(null);
  dialogConversationId: WritableSignal<string | null> = signal(null);
  renameDraft: WritableSignal<string> = signal('');
  
  text: string = '';
  bubbleCount = Array(7).fill(0).map((_, i) => i);
  isRecording: WritableSignal<boolean> = signal(false);
  recordingStatus: WritableSignal<string> = signal('Voice typing is ready.');
  recordingDurationSeconds: WritableSignal<number> = signal(0);
  isStreaming: WritableSignal<boolean> = signal(false);
  private speechRecognition?: any;
  private recordingIntervalId?: ReturnType<typeof setInterval>;
  private streamingIntervalId?: ReturnType<typeof setInterval>;
  private sendAfterRecording: boolean = false;
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

  canClearChat = computed(() => this.messages().length > 1);

  canRegenerateResponse = computed(() => {
    if (this.isLoading() || this.isStreaming()) return false;
    return this.messages().some(message => message.role === 'user');
  });

  sortedConversations = computed(() => {
    return [...this.conversations()].sort((a, b) => b.updatedAt - a.updatedAt);
  });

  selectedDialogConversation = computed(() => {
    const id = this.dialogConversationId();
    if (!id) return null;
    return this.conversations().find(chat => chat.id === id) || null;
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

    this.initializeConversations();
  }

  ngOnDestroy(): void {
    this.clearRecordingTimer();
    this.stopSpeechRecognition();
    this.stopStreamingResponse();
  }

  private getWelcomeMessage(): Message {
    return { role: 'ai', name: 'Fynx AI', text: 'Hello! I am Fynx AI, an advanced language model. How can I assist you today?' };
  }

  private createUserMessage(text: string): Message {
    return { role: 'user', name: this.user().name, text };
  }

  private createAiMessage(text: string, isThinking = false): Message {
    return { role: 'ai', name: 'Fynx AI', text, isThinking };
  }

  private getStorageKey(): string {
    return `fynx-chat-history-${this.user().id}`;
  }

  private persistConversations(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this.conversations()));
  }

  private initializeConversations(): void {
    if (typeof localStorage === 'undefined') {
      this.startNewChat();
      return;
    }

    const raw = localStorage.getItem(this.getStorageKey());
    if (!raw) {
      this.startNewChat();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ChatConversation[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.startNewChat();
        return;
      }

      this.conversations.set(parsed);
      const firstConversation = [...parsed].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      this.openConversation(firstConversation.id);
    } catch {
      this.startNewChat();
    }
  }

  startNewChat(): void {
    this.stopStreamingResponse();
    const newConversation: ChatConversation = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: 'New chat',
      updatedAt: Date.now(),
      messages: [this.getWelcomeMessage()]
    };

    this.conversations.update(chats => [newConversation, ...chats]);
    this.activeConversationId.set(newConversation.id);
    this.messages.set([...newConversation.messages]);
    this.persistConversations();
    this.scrollToBottom();
  }

  openConversation(conversationId: string): void {
    this.stopStreamingResponse();
    const selected = this.conversations().find(chat => chat.id === conversationId);
    if (!selected) return;

    this.activeConversationId.set(selected.id);
    this.messages.set([...selected.messages]);
    this.scrollToBottom();
  }

  renameConversation(conversationId: string): void {
    const conversation = this.conversations().find(chat => chat.id === conversationId);
    if (!conversation) return;

    this.dialogConversationId.set(conversationId);
    this.renameDraft.set(conversation.title || 'New chat');
    this.dialogMode.set('rename');
  }

  deleteConversation(conversationId: string): void {
    const conversation = this.conversations().find(chat => chat.id === conversationId);
    if (!conversation) return;

    this.dialogConversationId.set(conversationId);
    this.dialogMode.set('delete');
  }

  closeConversationDialog(): void {
    this.dialogMode.set(null);
    this.dialogConversationId.set(null);
    this.renameDraft.set('');
  }

  confirmConversationDialog(): void {
    const mode = this.dialogMode();
    const conversationId = this.dialogConversationId();
    if (!mode || !conversationId) {
      this.closeConversationDialog();
      return;
    }

    if (mode === 'rename') {
      const cleanTitle = this.renameDraft().trim();
      if (!cleanTitle) {
        return;
      }

      this.conversations.update(chats => chats.map(chat => {
        if (chat.id !== conversationId) return chat;
        return {
          ...chat,
          title: cleanTitle.slice(0, 60),
          updatedAt: Date.now()
        };
      }));

      this.persistConversations();
      this.closeConversationDialog();
      return;
    }

    if (mode === 'clear') {
      this.performClearChat();
      this.closeConversationDialog();
      return;
    }

    this.performDeleteConversation(conversationId);
    this.closeConversationDialog();
  }

  private performDeleteConversation(conversationId: string): void {
    const conversation = this.conversations().find(chat => chat.id === conversationId);
    if (!conversation) return;

    const remainingConversations = this.conversations().filter(chat => chat.id !== conversationId);

    if (remainingConversations.length === 0) {
      this.conversations.set([]);
      this.activeConversationId.set(null);
      this.messages.set([this.getWelcomeMessage()]);
      this.startNewChat();
      return;
    }

    this.conversations.set(remainingConversations);

    if (this.activeConversationId() === conversationId) {
      this.openConversation(remainingConversations[0].id);
    }

    this.persistConversations();
  }

  private syncActiveConversation(messages: Message[]): void {
    const activeId = this.activeConversationId();
    if (!activeId) return;

    this.conversations.update(chats => chats.map(chat => {
      if (chat.id !== activeId) return chat;

      const firstUserMessage = messages.find(message => message.role === 'user')?.text?.trim();
      const title = firstUserMessage
        ? firstUserMessage.slice(0, 40)
        : chat.title;

      return {
        ...chat,
        title,
        updatedAt: Date.now(),
        messages: [...messages],
      };
    }));

    this.persistConversations();
  }

  userHeaderAvatarUrl = computed(() => this.user().avatarUrl);

  getUserAvatar(): any {
    return this.user().avatarUrl;
  }

  send(): void {
    if (this.isRecording()) {
      this.sendAfterRecording = true;
      this.stopVoiceRecording();
      return;
    }

    if (!this.text.trim()) return;
    this.sendMessage();
  }

  isLoading(): boolean {
    const lastMessage = this.messages().slice(-1)[0];
    return lastMessage?.isThinking === true || this.isStreaming();
  }

  scrollToBottom(): void {
    requestAnimationFrame(() => {
      const container = this.messagesContainer?.nativeElement;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    });
  }

  trackByFn(index: number): number { return index; }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(val => !val);
  }

  sendMessage() {
    const userText = this.text.trim();
    if (!userText) return;

    this.messages.update(m => {
      const updated: Message[] = [...m, this.createUserMessage(userText)];
      this.syncActiveConversation(updated);
      return updated;
    });
    this.text = ''; 
    this.messages.update(m => {
      const updated: Message[] = [...m, this.createAiMessage('Thinking...', true)];
      this.syncActiveConversation(updated);
      return updated;
    });
    this.scrollToBottom();
    this.getAIReply(userText); 
  }

  clearChat(): void {
    const selectedId = this.activeConversationId();
    if (!selectedId) return;
    if (!this.canClearChat()) return;
    this.dialogConversationId.set(selectedId);
    this.dialogMode.set('clear');
  }

  private performClearChat(): void {
    const resetMessages: Message[] = [this.getWelcomeMessage()];
    this.messages.set(resetMessages);
    this.syncActiveConversation(resetMessages);
    this.conversations.update(chats => chats.map(chat => {
      if (chat.id !== this.activeConversationId()) return chat;
      return { ...chat, title: 'New chat' };
    }));
    this.persistConversations();
    this.recordingStatus.set('Chat cleared.');
    this.scrollToBottom();
  }

  regenerateLastResponse(): void {
    if (!this.canRegenerateResponse()) return;

    const lastUserMessage = [...this.messages()].reverse().find(message => message.role === 'user');
    if (!lastUserMessage) return;

    this.messages.update(messages => {
      const updatedMessages = messages.filter(message => !message.isThinking);
      if (updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].role === 'ai') {
        updatedMessages.pop();
      }
      const nextMessages: Message[] = [...updatedMessages, this.createAiMessage('Thinking...', true)];
      this.syncActiveConversation(nextMessages);
      return nextMessages;
    });

    this.scrollToBottom();
    this.getAIReply(lastUserMessage.text);
  }

  onMessageInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.send();
  }

  stopStreamingResponse(): void {
    if (!this.isStreaming() && !this.streamingIntervalId) {
      return;
    }

    if (this.streamingIntervalId) {
      clearInterval(this.streamingIntervalId);
      this.streamingIntervalId = undefined;
    }
    this.isStreaming.set(false);

    this.messages.update(messages => {
      const updatedMessages = [...messages];
      for (let index = updatedMessages.length - 1; index >= 0; index--) {
        if (updatedMessages[index].role === 'ai') {
          updatedMessages[index] = {
            ...updatedMessages[index],
            isThinking: false,
            text: `${updatedMessages[index].text}\n\n⏹️ Response stopped.`
          };
          break;
        }
      }
      this.syncActiveConversation(updatedMessages);
      return updatedMessages;
    });
  }

  private streamAIText(fullText: string): void {
    if (this.streamingIntervalId) {
      clearInterval(this.streamingIntervalId);
      this.streamingIntervalId = undefined;
    }

    const normalizedText = (fullText || 'Sorry, empty response.').trim();
    this.isStreaming.set(true);
    let charIndex = 0;

    this.messages.update(messages => {
      const updatedMessages = [...messages];
      for (let index = updatedMessages.length - 1; index >= 0; index--) {
        if (updatedMessages[index].role === 'ai') {
          updatedMessages[index] = {
            ...updatedMessages[index],
            isThinking: false,
            text: ''
          };
          break;
        }
      }
      this.syncActiveConversation(updatedMessages);
      return updatedMessages;
    });

    this.streamingIntervalId = setInterval(() => {
      if (!this.isStreaming()) {
        if (this.streamingIntervalId) {
          clearInterval(this.streamingIntervalId);
          this.streamingIntervalId = undefined;
        }
        return;
      }

      charIndex += 3;
      const nextText = normalizedText.slice(0, charIndex);

      this.messages.update(messages => {
        const updatedMessages = [...messages];
        for (let index = updatedMessages.length - 1; index >= 0; index--) {
          if (updatedMessages[index].role === 'ai') {
            updatedMessages[index] = {
              ...updatedMessages[index],
              isThinking: false,
              text: nextText
            };
            break;
          }
        }
        this.syncActiveConversation(updatedMessages);
        return updatedMessages;
      });

      this.scrollToBottom();

      if (charIndex >= normalizedText.length) {
        if (this.streamingIntervalId) {
          clearInterval(this.streamingIntervalId);
          this.streamingIntervalId = undefined;
        }
        this.isStreaming.set(false);
      }
    }, 24);
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
    const autoDetectedLanguage = this.detectRecognitionLanguage();
    this.speechRecognition.lang = autoDetectedLanguage;
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

      if (this.sendAfterRecording) {
        this.sendAfterRecording = false;
        this.send();
      }
    };

    this.speechRecognition.start();
    this.isRecording.set(true);
    this.recordingDurationSeconds.set(0);
    this.clearRecordingTimer();
    this.recordingIntervalId = setInterval(() => {
      this.recordingDurationSeconds.update(seconds => seconds + 1);
    }, 1000);
    this.recordingStatus.set(`Listening (${autoDetectedLanguage})... press again to stop.`);
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

  private detectRecognitionLanguage(): 'he-IL' | 'en-US' {
    const currentText = this.text.trim();
    if (/[\u0590-\u05FF]/.test(currentText)) {
      return 'he-IL';
    }
    if (/[A-Za-z]/.test(currentText)) {
      return 'en-US';
    }

    const browserLanguages = (typeof navigator !== 'undefined' ? navigator.languages : []) || [];
    if (browserLanguages.some(language => language.toLowerCase().startsWith('he'))) {
      return 'he-IL';
    }

    return 'en-US';
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
             const nextMessages: Message[] = [...updatedMessages, this.createAiMessage('A connection error occurred.')];
             this.syncActiveConversation(nextMessages);
             return nextMessages;
          });
          this.scrollToBottom();
          return throwError(() => new Error('API request failed'));
        })
      )
      .subscribe(response => this.processAIResponse(response));
  }

  processAIResponse(response: any) {
    const text = response.response;
    this.streamAIText(text || 'Sorry, empty response.');
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