import { Component, OnInit } from '@angular/core';
import { MainpageService } from '../../services/mainpage.service';
import { AwsService } from '../../services/aws.service';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-file-upload',
  standalone: false,
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
})
export class FileUploadComponent implements OnInit {
  selectedFile: File | null = null;
  uploadedFiles: { name: string; url: string; selected: boolean }[] = [];
  fileUrl: string = '';
  user: any = {};
  files: any[] = [];
  filePreviewUrl: SafeUrl | string | ArrayBuffer | null = null;
  fileType: string | undefined;
  excelPreview: string | undefined;
  excelData: any[] = [];

  constructor(
    private main: MainpageService,
    private http: HttpClient,
    private aws: AwsService,
    private sanitizer: DomSanitizer,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  getFileType(fileName: string): string {
    const fileExtension = fileName.toLowerCase().split('.').pop();
    switch (fileExtension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'mp4':
        return 'video';
      case 'docx':
        return 'word';
      case 'xlsx':
        return 'xlsx';
      case 'csv':
        return 'csv';
      default:
        return 'other';
    }
  }

  loadFiles() {
    this.main.getFiles().subscribe({
      next: (data) => {
        this.files = data;
        this.files.forEach((file) => {
          file.fileType = this.getFileType(file.fileName);
          file.selected = false;
          file.url = `https://akv-interns.s3.ap-south-1.amazonaws.com/AKV0779/fileuploads/${file.fileName}`;
        });
      },
      error: (error) => {
        console.error('Error in fetching files from AWS', error);
      },
    });
  }

  getFileIcon(fileType: string): string {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return 'bi-file-pdf text-danger';
      case 'image':
        return 'bi-file-image text-primary';
      case 'mp4':
        return 'bi-file-play text-success';
      case 'docx':
        return 'bi-file-word text-info';
      case 'xlsx':
        return 'bi-file-word text-info';
      case 'csv':
        return 'bi-file-word text-info';
      default:
        return 'bi-file-earmark text-warning';
    }
  }

  toggleFileSelection(file: { selected: boolean }, event: any) {
    const checked = event.target.checked;
    file.selected = checked;
  }

  downloadAllSelected(): void {
    const selectedFiles = this.files.filter((file) => file.selected);
    if (selectedFiles.length === 0) {
      this.toastr.error('Please Select Files to Download', 'Error');
      return;
    }

    const zip = new JSZip();
    const promises = selectedFiles.map((file, index) => {
      const fileName = file.fileName || `file_${index + 1}`;
      const fileUrl = file.url;

      const fileExtension = fileName.split('.').pop();
      const fullFileName = fileExtension ? fileName : `${fileName}.txt`;

      return fetch(fileUrl)
        .then((response) => response.blob())
        .then((blob) => {
          zip.file(fullFileName, blob);
        })
        .catch((error) => {
          console.error('Error downloading file:', error);
        });
    });

    Promise.all(promises)
      .then(() => {
        zip.generateAsync({ type: 'blob' }).then((content) => {
          saveAs(content, `downloaded_files_${Date.now()}.zip`);
        });
      })
      .catch((error) => {
        console.error('Error creating the ZIP file:', error);
      });
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      console.log(this.selectedFile);
    }
  }

  previewFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      console.log(this.filePreviewUrl);
      this.filePreviewUrl = reader.result;
    };
    reader.readAsDataURL(file);
  }

  previewUploadedFile(file: {
    fileName: string;
    url: string;
    fileType: string;
  }) {
    console.log('File clicked:', file);

    if (file.fileType.startsWith('image')) {
      this.filePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(file.url);
      this.fileType = 'image';
      console.log('Image file URL:', this.filePreviewUrl);
    } else if (file.fileType === 'pdf') {
      this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        file.url
      );
      this.fileType = 'pdf';
      console.log('PDF file URL:', this.filePreviewUrl);
    } else if (file.fileType === 'xlsx') {
      this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        file.url
      );
      this.fileType = 'xlsx';
      console.log('Excel file URL:', this.filePreviewUrl);
      this.fetchExcelFile(file.url);
    } else {
      this.filePreviewUrl = null;
      console.log('Cannot preview this file type');
    }
  }

  onUpload(): void {
    if (this.selectedFile) {
      const fileName = this.selectedFile.name;
      const fileType = this.selectedFile.type;
      this.aws.getPresignedUrl(fileName, fileType, '-1').subscribe({
        next: (response) => {
          const { presignedUrl, fileName, userId } = response;
          this.uploadToS3(presignedUrl, fileName, userId);
        },
        error: (error) => {
          console.error('Error getting presigned URL:', error);
        },
      });
    }
  }

  closePreview() {
    this.filePreviewUrl = null;
  }

  fetchExcelFile(fileUrl: string): void {
    this.http.get(fileUrl, { responseType: 'arraybuffer' }).subscribe(
      (data: ArrayBuffer) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const binaryData = e.target.result;
          const wb = XLSX.read(binaryData, { type: 'binary' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          this.excelData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
          });
        };
        reader.readAsBinaryString(blob);
      },
      (error: any) => {
        console.error('Error fetching or processing Excel file:', error);
      }
    );
  }

  uploadToS3(presignedUrl: string, fileName: string, userId: string): void {
    if (this.selectedFile) {
      this.aws.uploadFileToS3(presignedUrl, this.selectedFile).subscribe({
        next: (res: any) => {
          this.toastr.success('File uploaded successfully', 'Success');
          this.loadFiles();
          this.selectedFile = null;
        },
        error: (error) => {
          console.error('Error uploading file:', error);
        },
      });
    }
  }
}
