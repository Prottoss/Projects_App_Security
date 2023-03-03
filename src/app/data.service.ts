import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  carFound:any;

  constructor(private db: AngularFireDatabase) { }

  getUsers(){
    return this.db.list("users");
  }

  async findVehicleInDb(reg:any)
  {
    this.carFound = null;
    await this.getUsers().valueChanges().subscribe((res: any)=>{
      for(let user of res)
      {
        for(let car in user.vehicles)
        {
          if(car==reg){
            this.carFound = car;
          }
        } 
      }

      if(this.carFound!=null){
        console.log("Vehicle found: ", this.carFound);
        //return carFound;
      }
      else{
        console.log("No such vehicle in the databse!");
        //return null; 
      }   
    });
  }

  async findUserTicket(){

  }
}
