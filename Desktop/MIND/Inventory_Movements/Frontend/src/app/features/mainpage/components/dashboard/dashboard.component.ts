import { Component, OnInit } from '@angular/core';
import { AuthserviceService } from 'src/app/features/auth/services/authservice.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(private authService:AuthserviceService) { 
  }

  ngOnInit(): void {
  }

}
