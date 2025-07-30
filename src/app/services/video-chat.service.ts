import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { MockSocketService } from './mock-socket.service';

export interface VideoCall {
  id: string;
  roomId: string;
  taskId: number;
  createdBy: string;
  participants: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface CallParticipant {
  id: string;
  name: string;
  isHost: boolean;
  stream?: MediaStream;
}

@Injectable({
  providedIn: 'root'
})
export class VideoChatService {
  private socket!: MockSocketService;
  private localStream?: MediaStream;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private currentUserId?: string;

  // Observables for UI updates
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private participantsSubject = new BehaviorSubject<CallParticipant[]>([]);
  private localStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  private remoteStreamsSubject = new BehaviorSubject<Map<string, MediaStream>>(new Map());
  private incomingCallSubject = new BehaviorSubject<VideoCall | null>(null);
  private callStateSubject = new BehaviorSubject<'idle' | 'calling' | 'in-call' | 'connecting'>('idle');

  public isConnected$ = this.isConnectedSubject.asObservable();
  public participants$ = this.participantsSubject.asObservable();
  public localStream$ = this.localStreamSubject.asObservable();
  public remoteStreams$ = this.remoteStreamsSubject.asObservable();
  public incomingCall$ = this.incomingCallSubject.asObservable();
  public callState$ = this.callStateSubject.asObservable();

  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor() {
    this.socket = new MockSocketService();
    this.setupSocketListeners();
  }

  private initializeSocket() {
    // Using mock socket service for development
    // In production, you would use a real Socket.IO connection
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to video chat server');
      this.isConnectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from video chat server');
      this.isConnectedSubject.next(false);
    });

    this.socket.on('user-joined', (data: { userId: string, userName: string }) => {
      console.log('User joined:', data);
      this.handleUserJoined(data.userId, data.userName);
    });

    this.socket.on('user-left', (data: { userId: string }) => {
      console.log('User left:', data);
      this.handleUserLeft(data.userId);
    });

    this.socket.on('offer', (data: { from: string, offer: RTCSessionDescriptionInit }) => {
      console.log('Received offer from:', data.from);
      this.handleOffer(data.from, data.offer);
    });

    this.socket.on('answer', (data: { from: string, answer: RTCSessionDescriptionInit }) => {
      console.log('Received answer from:', data.from);
      this.handleAnswer(data.from, data.answer);
    });

    this.socket.on('ice-candidate', (data: { from: string, candidate: RTCIceCandidateInit }) => {
      console.log('Received ICE candidate from:', data.from);
      this.handleIceCandidate(data.from, data.candidate);
    });

    this.socket.on('incoming-call', (callData: VideoCall) => {
      console.log('Incoming call:', callData);
      this.incomingCallSubject.next(callData);
    });

    this.socket.on('call-ended', () => {
      console.log('Call ended by host');
      this.endCall();
    });
  }

  connect(userId: string) {
    this.currentUserId = userId;
    if (!this.socket.connected_value) {
      this.socket.auth = { userId };
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected_value) {
      this.socket.disconnect();
    }
    this.cleanup();
  }

  async createVideoCall(taskId: number, userName: string): Promise<string> {
    const roomId = uuidv4();
    
    try {
      // Get user media first
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      this.localStreamSubject.next(this.localStream);
      this.callStateSubject.next('calling');

      // Create room on server
      this.socket.emit('create-room', {
        roomId,
        taskId,
        userName,
        userId: this.currentUserId
      });

      return roomId;
    } catch (error) {
      console.error('Failed to create video call:', error);
      this.callStateSubject.next('idle');
      throw error;
    }
  }

  async joinVideoCall(roomId: string, userName: string): Promise<void> {
    try {
      // Get user media first
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      this.localStreamSubject.next(this.localStream);
      this.callStateSubject.next('connecting');

      // Join room on server
      this.socket.emit('join-room', {
        roomId,
        userName,
        userId: this.currentUserId
      });

      this.callStateSubject.next('in-call');
    } catch (error) {
      console.error('Failed to join video call:', error);
      this.callStateSubject.next('idle');
      throw error;
    }
  }

  private async handleUserJoined(userId: string, userName: string) {
    if (userId === this.currentUserId) return;

    const peerConnection = new RTCPeerConnection(this.configuration);
    this.peerConnections.set(userId, peerConnection);

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      this.remoteStreams.set(userId, remoteStream);
      this.remoteStreamsSubject.next(new Map(this.remoteStreams));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate
        });
      }
    };

    // Create offer if we're the initiator
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      this.socket.emit('offer', {
        to: userId,
        offer: offer
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
    }

    // Update participants
    this.updateParticipants();
  }

  private handleUserLeft(userId: string) {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }

    this.remoteStreams.delete(userId);
    this.remoteStreamsSubject.next(new Map(this.remoteStreams));
    this.updateParticipants();
  }

  private async handleOffer(from: string, offer: RTCSessionDescriptionInit) {
    let peerConnection = this.peerConnections.get(from);
    
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection(this.configuration);
      this.peerConnections.set(from, peerConnection);

      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Handle incoming stream
      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        this.remoteStreams.set(from, remoteStream);
        this.remoteStreamsSubject.next(new Map(this.remoteStreams));
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('ice-candidate', {
            to: from,
            candidate: event.candidate
          });
        }
      };
    }

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      this.socket.emit('answer', {
        to: from,
        answer: answer
      });
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }

  private async handleAnswer(from: string, answer: RTCSessionDescriptionInit) {
    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Failed to handle answer:', error);
      }
    }
  }

  private async handleIceCandidate(from: string, candidate: RTCIceCandidateInit) {
    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Failed to add ICE candidate:', error);
      }
    }
  }

  private updateParticipants() {
    const participants: CallParticipant[] = [];
    
    // Add self
    participants.push({
      id: this.currentUserId || 'me',
      name: 'You',
      isHost: true
    });

    // Add remote participants
    this.remoteStreams.forEach((stream, userId) => {
      participants.push({
        id: userId,
        name: `User ${userId}`,
        isHost: false,
        stream
      });
    });

    this.participantsSubject.next(participants);
  }

  endCall() {
    // Notify server
    this.socket.emit('end-call');
    
    // Clean up local resources
    this.cleanup();
    this.callStateSubject.next('idle');
  }

  private cleanup() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined;
      this.localStreamSubject.next(null);
    }

    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    // Clear remote streams
    this.remoteStreams.clear();
    this.remoteStreamsSubject.next(new Map());

    // Clear participants
    this.participantsSubject.next([]);

    // Clear incoming call
    this.incomingCallSubject.next(null);
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  acceptCall() {
    this.incomingCallSubject.next(null);
  }

  rejectCall() {
    this.incomingCallSubject.next(null);
  }
}
