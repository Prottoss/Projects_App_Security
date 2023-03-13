import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from "@capacitor/camera";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Filesystem } from '@capacitor/filesystem';
import { Directory } from '@capacitor/filesystem/dist/esm/definitions';
import { LoadingController, Platform } from '@ionic/angular';
import { finalize } from 'rxjs';
import { DataService } from './data.service';

const IMAGE_DIR = "stored-images";
@Injectable({
  providedIn: 'root'
})
export class ImageService {

  images: any;
  
  //api details
  apiUrl = "https://api.platerecognizer.com/v1/plate-reader/";
  token = "Token b52e5e9674fcb05988b8f207453578f42ac131b6";
  result: any;

  constructor(private http: HttpClient, private platform: Platform, private loadingCtrl: LoadingController, private  dataService:DataService){}

  async ngOnInit(){
    this.loadFiles();
  }

  async loadFiles()
  {
    this.images = [];

    const loading = await this.loadingCtrl.create({
      message: "Loading data...",
    });
    await loading.present();

    Filesystem.readdir({
      directory: Directory.Data,
      path: IMAGE_DIR
    }).then(result => {
      this.loadFileData(result.files);
    }, 
    async err => {
      console.log("err: ",err);
      await Filesystem.mkdir({
        directory: Directory.Data,
        path: IMAGE_DIR
      });
    }).then(_ => {
      loading.dismiss();
    })
  }

  async loadFileData(fileNames: any[]){
    for (let f of fileNames){
      const filePath = `${IMAGE_DIR}/${f.name}`;

      const readFile = await Filesystem.readFile({
        directory: Directory.Data,
        path: filePath
      });

      this.images.push({
        name: f.name,
        path: filePath,
        data: `data:image/jpeg;base64,${readFile.data}`
      })
    }
  }

  async captureImage(){
    const image = await Camera.getPhoto({
      width:1024,
      height:768,
      quality: 40,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });

    if (image){
      this.saveImage(image);
    }
  }

  //saves image
  async saveImage(photo: Photo)
  {
    const base64Data = await this.readAsBase64(photo);
    const fileName = new Date().getTime()+".jpeg";

    await Filesystem.writeFile({
      directory: Directory.Data,
      path: `${IMAGE_DIR}/${fileName}`,
      data: base64Data
    });
    this.loadFiles();
  }

  async sendImage(image: any) {
    const loading = await this.loadingCtrl.create({
      message: "Uploading...",
    });
    await loading.present();

    const headers = new HttpHeaders()
      .set('content-type', 'application/json')
      .set("Authorization", this.token);

    const body = {
      "regions": ["ie", "gb"],
      "upload": image.data
    }

    this.http.post(this.apiUrl, body, { headers: headers }).pipe(
      finalize(() => {
        loading.dismiss();
      })
    ).subscribe((res: any) => {
      console.log(res);
      if(res){
        this.result = res.results[0]["plate"];
        this.dataService.findVehicleInDb(this.result);
        setTimeout(()=>{
          this.deleteImage(image);
          this.result = null;
        },3000);
      } 
    });
  }

  async deleteImage(file: any)
  {
    await Filesystem.deleteFile({
      directory: Directory.Data,
      path: file.path
    });
    this.loadFiles();
  }

//Helper functions
  async readAsBase64(photo: Photo){
    if(this.platform.is("hybrid")){
      const file = await Filesystem.readFile({
        path: photo.path as string
      });

      return file.data;
    }
    else{
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      return await this.convertBlobToBase64(blob) as string;
    }
  }

  convertBlobToBase64 = (blob:Blob) => new Promise((resolve,reject) =>{
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () =>{
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

}
