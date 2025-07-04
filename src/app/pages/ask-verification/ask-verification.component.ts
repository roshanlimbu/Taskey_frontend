import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-ask-verification',
  imports: [CommonModule],
  templateUrl: './ask-verification.component.html',
  styleUrl: './ask-verification.component.scss',
})
export class AskVerificationComponent implements OnInit, OnDestroy {
  private verificationCheckSubscription?: Subscription;
  private readonly CHECK_INTERVAL = 10000; // Check every 10 seconds

  constructor(
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.startVerificationCheck();
  }

  ngOnDestroy() {
    if (this.verificationCheckSubscription) {
      this.verificationCheckSubscription.unsubscribe();
    }
  }

  private startVerificationCheck() {
    // Check immediately and then every 10 seconds
    this.checkVerificationStatus();

    this.verificationCheckSubscription = interval(
      this.CHECK_INTERVAL
    ).subscribe(() => {
      this.checkVerificationStatus();
    });
  }

  private checkVerificationStatus() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.id) {
      console.error('No user found in localStorage');
      this.router.navigate(['/login']);
      return;
    }
    const payload = {
      github_id: user.id,
    };

    // Call API to check current verification status
    this.apiService.post(`user/verificationstatus`, payload).subscribe({
      next: (response: any) => {
        if (
          response.is_user_verified === 1 ||
          response.is_user_verified === true
        ) {
          // User is now verified, update localStorage and redirect
          user.is_user_verified = 1;
          localStorage.setItem('user', JSON.stringify(user));

          // Redirect based on user role
          this.redirectToUserDashboard(user.role);
        }
      },
      error: (error) => {
        console.error('Error checking verification status:', error);
        // Continue checking even if there's an error
      },
    });
  }

  private redirectToUserDashboard(role: number) {
    // Stop the verification check
    if (this.verificationCheckSubscription) {
      this.verificationCheckSubscription.unsubscribe();
    }

    // Redirect based on role
    switch (role) {
      case 0:
        this.router.navigate(['/super/dashboard']);
        break;
      case 1:
        this.router.navigate(['/dashboard']);
        break;
      case 2:
        this.router.navigate(['/admin/dashboard']);
        break;
      case 3:
        this.router.navigate(['/user/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  public manualRefresh() {
    console.log('Manual refresh triggered');
    this.checkVerificationStatus();
  }
}
