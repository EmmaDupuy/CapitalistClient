import { Component, OnInit } from '@angular/core';
import { World, Pallier, Product } from '../world';
import { Input } from '@angular/core';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { RestserviceService } from "../restservice.service";
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {

  product: Product = new Product;
  server = "http://localhost:8080/"
  progressbarvalue: number = 0;
  progressbar: any;
  lastupdate = 0;
  _qtmulti: string = "";
  qtemax: number = 0;
  _money: number = 0;
  prix_actuel: number = 0;
  prix = 0;
  total = 0;
  coutP = 0;

  constructor(private service: RestserviceService, private snackBar: MatSnackBar) { }

  //init
  ngOnInit(): void {
    setInterval(() => { this.calcScore(); }, 100);
    this.progressbarvalue = 0;
    //this.calcPrice("x1");
  }

  //inputs
  @Input()
  set prod(value: Product) {
    this.product = value;
    this.prix_actuel = this.product.cout;
    if (this.product && this.product.timeleft > 0) {
      this.lastupdate = Date.now();
      let progress = (this.product.vitesse - this.product.timeleft) / this.product.vitesse;
      this.progressbar.set(progress);
      this.progressbar.animate(1, { duration: this.product.timeleft });
    }
  }

  @Input()
  set qtmulti(value: string) {
    this._qtmulti = value;
    if (this._qtmulti && this.product) {
      this.calcMaxBuy();
    }
  }

  @Input()
  set money(value: number) {
    this._money = value;
    if (this._money && this.product) {
      this.calcMaxBuy();
    }
  }

  //outputs
  @Output()
  notifyProduction: EventEmitter<Product> = new EventEmitter<Product>();

  @Output()
  notifyPurchase: EventEmitter<number> = new EventEmitter<number>();

  //fonctions
  startFabrication() {
    /*for (let i = 0; i < 100; i++) {
      this.progressbarvalue = i;
    }*/
    if(this.product.quantite !=0 ){
      this.product.timeleft = this.product.vitesse;
      this.lastupdate = Date.now();
    }

  }

  calcPrice(){
    switch(this._qtmulti){
      case "x1":
        this.coutP = this.product.cout;
        break;
      case "x10":
        this.coutP = this.product.cout *((1 - (this.product.croissance ** 10))/(1  - this.product.croissance));

        break;
      case "x100":
        this.coutP = this.product.cout *((1 - (Math.pow(this.product.croissance,100)) )/(1  - this.product.croissance));
        break;
      case "max":
        this.coutP = this.product.cout *((1 - Math.pow(this.product.croissance,this.qtemax))/(1  - this.product.croissance));
        break;
    }
    /*if (this._qtmulti=="x1"){
      this.prix=this.product.cout;
    }
    else if (this._qtmulti=="x10"){
      this.prix=this.product.cout *((1 - (this.product.croissance ** 10))/(1  - this.product.croissance));
    }
    else if (this._qtmulti=="x100"){
      this.prix=this.product.cout *((1 - (Math.pow(this.product.croissance,100)) )/(1  - this.product.croissance));
    }
    else {
      this.prix=this.product.cout *((1 - Math.pow(this.product.croissance,this.qtemax))/(1  - this.product.croissance));
    }*/
  }

  calcScore() {
    if (this.product.managerUnlocked && this.product.timeleft == 0) {
      this.startFabrication();
    }
    if (this.product.timeleft != 0) {
      this.product.timeleft = this.product.vitesse - (Date.now() - this.lastupdate);
    }
    if (this.product.timeleft <= 0 || this.product.timeleft == null) {
      this.progressbarvalue = 0;
      this.notifyProduction.emit(this.product);
      this.product.timeleft = 0;
    } else {
      this.progressbarvalue = ((this.product.vitesse - this.product.timeleft) / this.product.vitesse) * 100
    }
  }

  calcMaxBuy() {
    let qtmax = ((Math.log(1 - ((this._money * (1 - this.product.croissance)) / this.product.cout)) / Math.log(this.product.croissance)));
    if (qtmax < 0) {
      this.qtemax = 0;
    } else {
      this.qtemax = Math.floor(qtmax);
    }
  }

  achatProd(){
    console.log("achat: "+this.product.name);
    switch (this._qtmulti) {
      case "x1":
        this.total = this.product.cout;
        this.product.cout = this.product.croissance * this.product.cout;
        this.product.quantite += 1;
        break;
      case "x10":
        this.total = this.product.cout *((1 - (this.product.croissance ** 10))/(1  - this.product.croissance));
        this.product.cout = (this.product.croissance ** 10) * this.product.cout;
        this.product.quantite += 10;
        break;
      case "x100":
        this.total = this.product.cout *((1 - (Math.pow(this.product.croissance,100)) )/(1  - this.product.croissance));
        this.product.cout = (this.product.croissance ** 100) * this.product.cout;
        this.product.quantite += 100;
        break;
      case "max":
        this.total = this.product.cout *((1 - Math.pow(this.product.croissance,this.qtemax))/(1  - this.product.croissance));
        this.product.cout = (this.product.croissance ** this.qtemax) * this.product.cout;
        this.product.quantite += this.qtemax;
        break;
    }
    this.notifyPurchase.emit(this.total);
    this.service.putProduct(this.product);
    this.calcPrice();
  }
}
