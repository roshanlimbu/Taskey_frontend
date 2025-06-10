import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectReportPageComponent } from './project-report-page.component';

describe('ProjectReportPageComponent', () => {
  let component: ProjectReportPageComponent;
  let fixture: ComponentFixture<ProjectReportPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectReportPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectReportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
