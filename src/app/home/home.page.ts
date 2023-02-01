import { Component, OnInit } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from "@capacitor/camera";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Filesystem } from '@capacitor/filesystem';
import { Directory } from '@capacitor/filesystem/dist/esm/definitions';
import { readBlobAsBase64 } from '@capacitor/core/types/core-plugins';
import { LoadingController, Platform } from '@ionic/angular';

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
  
  //image = "https://licenseplatemania.com/fotos/ierland/ierland70.jpg";
  image!: any;
  images: userImage[] = [];
  
  //api details
  apiUrl = "https://api.platerecognizer.com/v1/plate-reader/";
  token = "Token b52e5e9674fcb05988b8f207453578f42ac131b6";
  result: any;



  constructor(private http: HttpClient, private platform: Platform, private loadingCtrl: LoadingController){}

  async ngOnInit(){
    //this.loadFiles();
  }

  // async loadFiles()
  // {
  //   //this.images;

  //   const loading = await this.loadingCtrl.create({
  //     message: "Loading data...",
  //   });
  //   await loading.present();

  //   Filesystem.readdir({
  //     directory: Directory.Data,
  //     path: IMAGE_DIR
  //   }).then(result => {
  //     console.log("HERE: ", result);
  //     this.loadFileData(result.files);
  //   }, async err => {
  //     console.log("err: ",err);
  //     await Filesystem.mkdir({
  //       directory: Directory.Data,
  //       path: IMAGE_DIR
  //     });
  //   }).then(_ => {
  //     loading.dismiss();
  //   })
  // }

  // async loadFileData(fileNames: any){
  //   for (let f of fileNames){
  //     const filePath = `${IMAGE_DIR}/${f}`;

  //     const readFile = await Filesystem.readFile({
  //       directory: Directory.Data,
  //       path: filePath
  //     });

  //     this.images.push({
  //       name: f,
  //       path: filePath,
  //       data: `data:image/jpeg;base64,${readFile.data}`
  //     })
  //     console.log("READ: ",readFile);
  //   }
  // }

  async captureImage(){
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });
    console.log("image: ", image);

    if (image){
      this.saveImage(image);
    }
    
    //convert image to file
    this.image = image.dataUrl; // file is the image
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
    //this.loadFiles();
  }

  //Sends image to API
  async sendImage()
  {
    const headers = new HttpHeaders()
      .set('content-type', 'application/json')
      .set("Authorization", this.token);

    const body = {
      "regions": ["ie","gb"],
      "upload": this.image
    }

    this.http.post(this.apiUrl,body,{headers:headers})
    .subscribe((res:any)=>{
      console.log(res.results[0]["plate"]);
      this.result = res.results[0]["plate"];
    }); 
  }

//Helper functions
async readAsBase64(photo: Photo){
  if(this.platform.is("hybrid")){
    const file = await Filesystem.readFile({
      path: photo.path!
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
