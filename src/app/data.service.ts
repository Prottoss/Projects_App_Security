import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  carFound:any;
  carOwner: any;
  ticket: any;
  validTicket: any;

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
      }
      else{
        console.log("No such vehicle in the databse!"); 
      }   
    });
  }

  async findUserTicket(uid: any) {
    const date = new Date();
    this.db.list("users/"+uid+"/tickets/").valueChanges().subscribe((res: any)=>{
      for(let ticket of res){
        const date2 = new Date(ticket.ticketEnd);
        if(date2 > date){
          this.validTicket = true;
          console.log("Not Expired",ticket.ticketEnd);
          break;
        }else{
          this.validTicket = false;
          console.log("Expired",ticket.ticketEnd);
        }

      } 
    });
  }
}
