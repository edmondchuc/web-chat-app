import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

// This service handles the upload of images
export class ImageService {

  constructor(private http:HttpClient) { 

  }

  upload(fd) {
    console.log('uploading service');
    return this.http.post<any>('/api/image/upload', fd);
  }
}
