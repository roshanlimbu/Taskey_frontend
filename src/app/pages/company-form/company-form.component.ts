import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

@Component({
  selector: 'app-company-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-form.component.html',
  styleUrl: './company-form.component.scss',
})
export class CompanyFormComponent implements OnInit {
  isCompanyOwner = false;
  isSubmitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  // Company owner form data
  companyForm = {
    name: '',
    email: '',
    phone: '',
    address: '',
  };

  // User form data
  selectedCompanyId = '';
  companies: Company[] = [];
  selectedCompanyDetails: any = {};

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadCompanies();
  }

  get selectedCompany(): Company | undefined {
    return this.companies.find((c) => c.id == this.selectedCompanyId);
  }

  private getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private updateUserCompanyId(companyId: string) {
    const user = this.getCurrentUser();
    if (user) {
      user.company_id = companyId;
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  private redirectToDashboard() {
    const user = this.getCurrentUser();
    if (user) {
      switch (user.role) {
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
    } else {
      this.router.navigate(['/login']);
    }
  }

  onUserTypeChange() {
    // Reset forms when user type changes
    this.companyForm = {
      name: '',
      email: '',
      phone: '',
      address: '',
    };
    this.selectedCompanyId = '';
    this.message = '';
    this.messageType = '';
  }

  loadCompanies() {
    // Load companies from API
    this.apiService.get('company').subscribe({
      next: (response: any) => {
        this.companies = response || [];
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        // Mock data for development
        this.companies = [
          {
            id: '1',
            name: 'Tech Corp',
            email: 'contact@techcorp.com',
            phone: '+1234567890',
            address: '123 Tech Street',
          },
          {
            id: '2',
            name: 'Design Studio',
            email: 'hello@designstudio.com',
            phone: '+1234567891',
            address: '456 Design Avenue',
          },
          {
            id: '3',
            name: 'Marketing Hub',
            email: 'info@marketinghub.com',
            phone: '+1234567892',
            address: '789 Marketing Blvd',
          },
        ];
      },
    });
  }

  onSubmit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.message = '';
    this.messageType = '';

    if (this.isCompanyOwner) {
      // Submit company owner form
      this.submitCompanyForm();
    } else {
      // Submit user form
      this.submitUserForm();
    }
  }

  submitCompanyForm() {
    if (
      this.companyForm.name &&
      this.companyForm.email &&
      this.companyForm.phone &&
      this.companyForm.address
    ) {
      this.apiService.post('company/add', this.companyForm).subscribe({
        next: (response: any) => {
          console.log('Company created successfully:', response);
          this.message =
            'Company registered successfully! Redirecting to dashboard...';
          this.messageType = 'success';
          this.isSubmitting = false;

          // Update user's company_id in localStorage
          const companyId = response.data?.id || response.id;
          if (companyId) {
            this.updateUserCompanyId(companyId);
          }

          // Reset form
          this.companyForm = {
            name: '',
            email: '',
            phone: '',
            address: '',
          };

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            this.redirectToDashboard();
          }, 2000);
        },
        error: (error) => {
          console.error('Error creating company:', error);
          this.message =
            error.message || 'Error registering company. Please try again.';
          this.isSubmitting = false;
        },
      });
    } else {
      this.message = 'Please fill in all required fields.';
      this.messageType = 'error';
      this.isSubmitting = false;
    }
  }

  submitUserForm() {
    if (this.selectedCompanyId) {
      const payload = {
        company_id: this.selectedCompanyId,
      };

      this.apiService
        .post('company/assign-company-to-user', payload)
        .subscribe({
          next: (response: any) => {
            console.log('User joined company successfully:', response);
            this.message =
              'Successfully joined the company! Redirecting to dashboard...';
            this.messageType = 'success';
            this.isSubmitting = false;

            this.updateUserCompanyId(this.selectedCompanyId);

            // Reset form
            this.selectedCompanyId = '';

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              this.redirectToDashboard();
            }, 2000);
          },
          error: (error) => {
            console.error('Error joining company:', error);
            this.message = 'Error joining company. Please try again.';
            this.messageType = 'error';
            this.isSubmitting = false;
          },
        });
    } else {
      this.message = 'Please select a company.';
      this.messageType = 'error';
      this.isSubmitting = false;
    }
  }
}
