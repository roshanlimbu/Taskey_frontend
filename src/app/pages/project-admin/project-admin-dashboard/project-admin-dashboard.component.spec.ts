import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAdminDashboardComponent } from './project-admin-dashboard.component';

describe('ProjectAdminDashboardComponent', () => {
  let component: ProjectAdminDashboardComponent;
  let fixture: ComponentFixture<ProjectAdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectAdminDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectAdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
