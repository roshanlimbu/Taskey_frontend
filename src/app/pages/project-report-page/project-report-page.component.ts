import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { marked } from 'marked';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-project-report-page',
  templateUrl: './project-report-page.component.html',
  styleUrls: ['./project-report-page.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ProjectReportPageComponent implements OnInit {
  parsedReport: SafeHtml = '';
  reportTitle: string = '';
  loading = true;
  reportNotFound = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    this.apiService
      .get<any>(`sadmin/reports/${projectId}`)
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            this.reportNotFound = true;
            console.log(this.reportNotFound);
          }
          this.loading = false;
          return throwError(() => error);
        })
      )
      .subscribe(async (res) => {
        if (res.success && res.data.length > 0) {
          const report = res.data[0];
          this.reportTitle = report.title || 'Project Report';
          const html = await marked.parse(report.report);
          this.parsedReport = this.sanitizer.bypassSecurityTrustHtml(html);
          this.reportNotFound = false;
        }
        this.loading = false;
      });
  }

  downloadReportAsPDF() {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;
    html2canvas(reportContent).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('project-report.pdf');
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
