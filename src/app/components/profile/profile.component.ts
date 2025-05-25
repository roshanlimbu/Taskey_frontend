import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  userProifle: any;

  ngOnInit() {
    this.userProifle = JSON.parse(localStorage.getItem('user') || '{}');
  }
}
