import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { ImageService } from '../image.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  constructor(public imageService: ImageService, public dService: DataService){
  }

  async ngOnInit(){
    this.imageService.loadFiles();
  }
}
