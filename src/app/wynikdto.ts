export class WynikDto{
    Id?: string | null = null;
    A: string;
    B: string;
    C: string;
    D: string;
    Res: string;
    Date: string | null = null;
    S: string;
    constructor(a:string, b: string, c:string, d:string, res:string, s:string){
        this.A = a;
        this.B = b;
        this.C = c;
        this.D = d;
        this.Res = res;
        this.S = s;
    }
  }