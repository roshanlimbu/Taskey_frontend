import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Help Button -->
      <button 
        (click)="toggleMenu()" 
        [class]="needsHelp ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-orange-500 hover:bg-orange-600'"
        class="text-white px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1">
        <span class="material-symbols-outlined text-sm">help</span>
        {{ needsHelp ? 'HELP NEEDED' : 'Need Help?' }}
      </button>

      <!-- Dropdown Menu -->
      <div *ngIf="showMenu" class="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-48">
        <div class="py-1">
          <!-- Toggle Help Status -->
          <button 
            (click)="toggleHelpStatus()" 
            class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
            <span class="material-symbols-outlined text-sm mr-2">
              {{ needsHelp ? 'check' : 'priority_high' }}
            </span>
            {{ needsHelp ? 'Mark as Resolved' : 'Mark as Need Help' }}
          </button>

          <!-- Start Video Call (only if help is needed) -->
          <button 
            *ngIf="needsHelp"
            (click)="startVideoCall()" 
            class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-blue-600">
            <span class="material-symbols-outlined text-sm mr-2">videocam</span>
            Start Video Call
          </button>

          <!-- Join Video Call -->
          <button 
            (click)="joinVideoCall()" 
            class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-green-600">
            <span class="material-symbols-outlined text-sm mr-2">video_call</span>
            Join Video Call
          </button>

          <hr class="my-1">

          <!-- Chat Option -->
          <button 
            (click)="openChat()" 
            class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
            <span class="material-symbols-outlined text-sm mr-2">chat</span>
            Open Chat
          </button>
        </div>
      </div>
    </div>

    <!-- Click Outside Detector -->
    <div *ngIf="showMenu" (click)="closeMenu()" class="fixed inset-0 z-10"></div>
  `,
  styles: [`
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
  `]
})
export class HelpButtonComponent {
  @Input() needsHelp = false;
  @Input() taskId!: number;
  @Output() helpStatusChange = new EventEmitter<boolean>();
  @Output() videoCallStart = new EventEmitter<void>();
  @Output() videoCallJoin = new EventEmitter<void>();
  @Output() chatOpen = new EventEmitter<void>();

  showMenu = false;

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  closeMenu() {
    this.showMenu = false;
  }

  toggleHelpStatus() {
    this.needsHelp = !this.needsHelp;
    this.helpStatusChange.emit(this.needsHelp);
    this.closeMenu();
  }

  startVideoCall() {
    this.videoCallStart.emit();
    this.closeMenu();
  }

  joinVideoCall() {
    this.videoCallJoin.emit();
    this.closeMenu();
  }

  openChat() {
    this.chatOpen.emit();
    this.closeMenu();
  }
}
