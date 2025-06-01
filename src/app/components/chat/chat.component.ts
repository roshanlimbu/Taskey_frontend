import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  @Input() taskId!: number;
  chatId: number | null = null;
  messages: any[] = [];
  participants: any[] = [];
  newMessage = '';
  loading = false;
  error = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    if (this.taskId) {
      this.loadChat();
    }
  }

  loadChat() {
    this.loading = true;
    this.apiService.get(`tasks/${this.taskId}/chat`).subscribe({
      next: (res: any) => {
        this.chatId = res.chat_id;
        this.messages = res.messages;
        this.participants = res.participants;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Could not load chat.';
        this.loading = false;
      },
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.chatId) return;
    const msg = this.newMessage.trim();
    this.apiService
      .post(`chats/${this.chatId}/messages`, { message: msg })
      .subscribe({
        next: (res: any) => {
          this.messages.push(res.message);
          this.newMessage = '';
        },
        error: () => {
          // Optionally show error
        },
      });
  }
}
