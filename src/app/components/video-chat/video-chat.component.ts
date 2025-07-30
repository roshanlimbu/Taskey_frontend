import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoChatService, CallParticipant } from '../../services/video-chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Video Chat Room Modal -->
    <div *ngIf="isVisible" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-6xl h-4/5 flex flex-col">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-xl font-bold text-gray-800">Video Call</h2>
            <p class="text-sm text-gray-600" *ngIf="roomId">Room: {{ roomId }}</p>
          </div>
          <button 
            (click)="endCall()" 
            class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
            End Call
          </button>
        </div>

        <!-- Video Grid -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <!-- Local Video -->
          <div class="relative bg-gray-800 rounded-lg overflow-hidden">
            <video 
              #localVideo 
              autoplay 
              muted 
              playsinline 
              class="w-full h-full object-cover">
            </video>
            <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              You
            </div>
            <div class="absolute top-2 right-2 flex gap-2">
              <button 
                (click)="toggleAudio()" 
                [class]="audioEnabled ? 'bg-green-500' : 'bg-red-500'"
                class="text-white p-2 rounded-full text-xs">
                <span class="material-symbols-outlined text-sm">
                  {{ audioEnabled ? 'mic' : 'mic_off' }}
                </span>
              </button>
              <button 
                (click)="toggleVideo()" 
                [class]="videoEnabled ? 'bg-green-500' : 'bg-red-500'"
                class="text-white p-2 rounded-full text-xs">
                <span class="material-symbols-outlined text-sm">
                  {{ videoEnabled ? 'videocam' : 'videocam_off' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Remote Videos -->
          <div 
            *ngFor="let participant of remoteParticipants" 
            class="relative bg-gray-800 rounded-lg overflow-hidden">
            <video 
              [id]="'remote-video-' + participant.id"
              autoplay 
              playsinline 
              class="w-full h-full object-cover">
            </video>
            <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {{ participant.name }}
            </div>
          </div>

          <!-- Empty slots for more participants -->
          <div 
            *ngFor="let slot of emptySlots" 
            class="bg-gray-200 rounded-lg flex items-center justify-center">
            <div class="text-gray-400 text-center">
              <span class="material-symbols-outlined text-4xl block mb-2">person_add</span>
              <p class="text-sm">Waiting for participant</p>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex justify-center gap-4">
          <button 
            (click)="copyRoomCode()" 
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">content_copy</span>
            Copy Room Code
          </button>
          
          <button 
            (click)="shareRoomCode()" 
            class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">share</span>
            Share Room
          </button>
        </div>

        <!-- Participants List -->
        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-700 mb-2">Participants ({{ participants.length }})</h3>
          <div class="flex flex-wrap gap-2">
            <span 
              *ngFor="let participant of participants" 
              class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {{ participant.name }}
              <span *ngIf="participant.isHost" class="ml-1 text-xs">(Host)</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Room Code Display Modal -->
    <div *ngIf="showRoomCodeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Room Created Successfully!</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Room Code:</label>
          <div class="flex items-center gap-2">
            <input 
              type="text" 
              [value]="roomId" 
              readonly 
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
            <button 
              (click)="copyRoomCode()" 
              class="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600">
              Copy
            </button>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          Share this room code with your team members so they can join the video call.
        </p>
        <div class="flex justify-end gap-2">
          <button 
            (click)="shareRoomCode()" 
            class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
            Share
          </button>
          <button 
            (click)="showRoomCodeModal = false" 
            class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Incoming Call Modal -->
    <div *ngIf="incomingCall" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md text-center">
        <div class="mb-4">
          <span class="material-symbols-outlined text-6xl text-blue-500 block mb-2">videocam</span>
          <h3 class="text-lg font-bold text-gray-800">Incoming Video Call</h3>
          <p class="text-gray-600">{{ incomingCall.createdBy }} is calling you</p>
        </div>
        <div class="flex justify-center gap-4">
          <button 
            (click)="acceptCall()" 
            class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center gap-2">
            <span class="material-symbols-outlined">call</span>
            Accept
          </button>
          <button 
            (click)="rejectCall()" 
            class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 flex items-center gap-2">
            <span class="material-symbols-outlined">call_end</span>
            Decline
          </button>
        </div>
      </div>
    </div>

    <!-- Join Room Modal -->
    <div *ngIf="showJoinModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Join Video Call</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Room Code:</label>
          <input 
            type="text" 
            [(ngModel)]="joinRoomCode" 
            placeholder="Enter room code..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300">
        </div>
        <div class="flex justify-end gap-2">
          <button 
            (click)="showJoinModal = false" 
            class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
            Cancel
          </button>
          <button 
            (click)="joinRoom()" 
            [disabled]="!joinRoomCode.trim()"
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Join
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Messages -->
    <div *ngIf="toastMessage" class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      {{ toastMessage }}
    </div>
  `,
  styles: [`
    video {
      transform: scaleX(-1); /* Mirror local video */
    }
    
    video[id^="remote-video"] {
      transform: none; /* Don't mirror remote videos */
    }
  `]
})
export class VideoChatComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Input() taskId?: number;
  @Input() userName = 'User';
  @Output() close = new EventEmitter<void>();

  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;

  roomId = '';
  showRoomCodeModal = false;
  showJoinModal = false;
  joinRoomCode = '';
  toastMessage = '';
  
  participants: CallParticipant[] = [];
  remoteParticipants: CallParticipant[] = [];
  emptySlots: number[] = [];
  
  audioEnabled = true;
  videoEnabled = true;
  
  incomingCall: any = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private videoChatService: VideoChatService
  ) {}

  ngOnInit() {
    // Subscribe to video chat service observables
    this.subscriptions.push(
      this.videoChatService.participants$.subscribe(participants => {
        this.participants = participants;
        this.remoteParticipants = participants.filter(p => !p.isHost);
        this.updateEmptySlots();
      }),

      this.videoChatService.localStream$.subscribe(stream => {
        if (stream && this.localVideoRef) {
          this.localVideoRef.nativeElement.srcObject = stream;
        }
      }),

      this.videoChatService.remoteStreams$.subscribe(streams => {
        // Attach remote streams to video elements
        streams.forEach((stream, userId) => {
          const videoElement = document.getElementById(`remote-video-${userId}`) as HTMLVideoElement;
          if (videoElement) {
            videoElement.srcObject = stream;
          }
        });
      }),

      this.videoChatService.incomingCall$.subscribe(call => {
        this.incomingCall = call;
      }),

      this.videoChatService.callState$.subscribe(state => {
        if (state === 'calling') {
          this.showRoomCodeModal = true;
        }
      })
    );

    // Connect to video chat service
    const userId = this.getCurrentUserId();
    this.videoChatService.connect(userId);

    // Auto-create room if taskId is provided
    if (this.taskId && this.isVisible) {
      this.createRoom();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.videoChatService.disconnect();
  }

  private getCurrentUserId(): string {
    // Get user ID from localStorage or auth service
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id?.toString() || 'anonymous-' + Date.now();
  }

  private updateEmptySlots() {
    const totalSlots = 6; // Maximum participants in grid
    const usedSlots = this.participants.length;
    const emptyCount = Math.max(0, totalSlots - usedSlots);
    this.emptySlots = Array(emptyCount).fill(0).map((_, i) => i);
  }

  async createRoom() {
    if (!this.taskId) {
      this.showToast('Task ID is required to create a video call');
      return;
    }

    try {
      this.roomId = await this.videoChatService.createVideoCall(this.taskId, this.userName);
      console.log('Room created:', this.roomId);
    } catch (error) {
      console.error('Failed to create room:', error);
      this.showToast('Failed to create video call. Please check camera/microphone permissions.');
    }
  }

  showJoinRoomModal() {
    this.showJoinModal = true;
  }

  async joinRoom() {
    if (!this.joinRoomCode.trim()) {
      this.showToast('Please enter a room code');
      return;
    }

    try {
      await this.videoChatService.joinVideoCall(this.joinRoomCode.trim(), this.userName);
      this.roomId = this.joinRoomCode.trim();
      this.showJoinModal = false;
      this.joinRoomCode = '';
    } catch (error) {
      console.error('Failed to join room:', error);
      this.showToast('Failed to join video call. Please check camera/microphone permissions.');
    }
  }

  async acceptCall() {
    if (!this.incomingCall) return;
    
    try {
      await this.videoChatService.joinVideoCall(this.incomingCall.roomId, this.userName);
      this.roomId = this.incomingCall.roomId;
      this.videoChatService.acceptCall();
    } catch (error) {
      console.error('Failed to accept call:', error);
      this.showToast('Failed to accept call. Please check camera/microphone permissions.');
    }
  }

  rejectCall() {
    this.videoChatService.rejectCall();
  }

  endCall() {
    this.videoChatService.endCall();
    this.close.emit();
  }

  toggleAudio() {
    this.audioEnabled = this.videoChatService.toggleAudio();
  }

  toggleVideo() {
    this.videoEnabled = this.videoChatService.toggleVideo();
  }

  copyRoomCode() {
    if (this.roomId) {
      navigator.clipboard.writeText(this.roomId).then(() => {
        this.showToast('Room code copied to clipboard!');
      }).catch(() => {
        this.showToast('Failed to copy room code');
      });
    }
  }

  shareRoomCode() {
    if (this.roomId) {
      const shareText = `Join our video call! Room code: ${this.roomId}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Video Call Room Code',
          text: shareText
        }).catch(() => {
          this.fallbackShare(shareText);
        });
      } else {
        this.fallbackShare(shareText);
      }
    }
  }

  private fallbackShare(text: string) {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Room code copied to clipboard for sharing!');
    }).catch(() => {
      this.showToast('Failed to copy room code');
    });
  }

  private showToast(message: string) {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
  }
}
