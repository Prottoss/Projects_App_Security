import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  carFound:any;
  carOwner: any;
  ticket: any;

  constructor(private db: AngularFireDatabase) { }

  getUsers(){
    return this.db.list("users");
  }

  async findVehicleInDb(reg:any)
  {
    this.carFound = null;
    this.carOwner = null;

    await this.getUsers().valueChanges().subscribe((res: any)=>{
      for(let user of res)
      {
        for(let car in user.vehicles)
        {
          if(car==reg){
            this.carFound = car;
            this.carOwner = user;
          }
        } 
      }

      if(this.carFound!=null){
        console.log("Vehicle found: ", this.carFound);
        console.log("owner ",this.carOwner.email);
        
        this.findUserTicket(this.carOwner.uid);
        //return carFound;
      }
      else{
        console.log("No such vehicle in the databse!");
        //return null; 
      }   
    });
  }

  async findUserTicket(uid: any) {
    this.db.object("users/"+uid+"/tickets/");
  }
}
