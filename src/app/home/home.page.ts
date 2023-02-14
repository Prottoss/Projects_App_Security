import { Component, OnInit } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from "@capacitor/camera";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Filesystem } from '@capacitor/filesystem';
import { Directory, FileInfo } from '@capacitor/filesystem/dist/esm/definitions';
import { readBlobAsBase64 } from '@capacitor/core/types/core-plugins';
import { LoadingController, Platform } from '@ionic/angular';
import { Form } from '@angular/forms';
import { finalize } from 'rxjs';

const IMAGE_DIR = "stored-images";

interface userImage{
  name: string;
  path: string;
  data: string;
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  
  images: userImage[] = [];
  
  //api details
  apiUrl = "https://api.platerecognizer.com/v1/plate-reader/";
  token = "Token b52e5e9674fcb05988b8f207453578f42ac131b6";
  result: any;



  constructor(private http: HttpClient, private platform: Platform, private loadingCtrl: LoadingController){}

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

      console.log("HERE: ", result);
      this.loadFileData(result.files);

    }, async err => {
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
      console.log("HERE2: ",f);
      

      const readFile = await Filesystem.readFile({
        directory: Directory.Data,
        path: filePath
      });

      this.images.push({
        name: f.name,
        path: filePath,
        data: `data:image/jpeg;base64,${readFile.data}`
      })
      console.log("READ: ",readFile.data);
    }
  }

  async captureImage(){
    const image = await Camera.getPhoto({
      quality: 40,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });
    //console.log("image: ", image.dataUrl);

    //this.uploadData(image);

    if (image){
      this.saveImage(image);
    }
  }

  //saves image
  async saveImage(photo:Photo)
  {
    const base64Data = await this.readAsBase64(photo);
    console.log(base64Data);
    
    const fileName = new Date().getTime()+".jpeg";
    const savedFile = await Filesystem.writeFile({
      directory: Directory.Data,
      path: `${IMAGE_DIR}/${fileName}`,
      data: base64Data
    });
    console.log("saved: ", savedFile);
    this.loadFiles();
  }

  async sendImage(file: userImage)
  {
    const response = await fetch(file.data);
    console.log("READ3",response);
    const blob = await response.blob();
    //console.log("READ4",blob);
    const formData = new FormData();
    formData.append("upload",file.data);
    formData.append("regions","ie");
    console.log("UPLOADRDY: ",file.data);
    
    //this.uploadData(formData);
    this.uploadData(file);
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

async uploadData(image: any){
  const loading = await this.loadingCtrl.create({
    message: "Uploading...",
  });
  await loading.present();

  console.log("IMAGEUPLOAD",image.data);
  
  const headers = new HttpHeaders()
      .set('content-type', 'application/json')
      //.set("Access-Control-Allow-Origin","*")
      //.set("Access-Control-Request-Method","method")
      .set("Authorization", this.token);

    const body = {
      "regions": ["ie","gb"],
      "upload": image.data
    }

    // const body = new FormData();
    // body.append("upload",image);
    // body.append("regions","ie,gb");

    this.http.post(this.apiUrl,body,{headers:headers}).pipe(
      finalize(() => {
        loading.dismiss();
      })
    ).subscribe((res:any)=>{
      console.log(res.results[0]["plate"]);
      this.result = res.results[0]["plate"];
    }); 


}

async deleteImage(file:userImage)
{
  await Filesystem.deleteFile({
    directory: Directory.Data,
    path: file.path
  });
  this.loadFiles();

}
}
