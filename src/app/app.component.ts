import { Component, OnInit } from '@angular/core';
import { WynikDto } from './wynikdto';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent  implements OnInit{
  subject = new FormControl(0);
  lab:any = [
    {id: 0, label: "Wybierz wielkości"}, 
    {id: 1, label: "10x10"}, 
  ];

  constructor(){
  }
  ngOnInit(): void {
    this.subject.valueChanges.subscribe((res: any)=>{
      console.log("SUBJECT", res);
    })
    
  }


}
