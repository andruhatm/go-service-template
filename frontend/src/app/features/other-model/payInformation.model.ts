import {Observable} from "rxjs";
import {ExistingUser} from "../users/models/existing-user.model";

export interface PayInformationModel{
  createDate: string,
  status: string,
  emailAddress: string,
  value: string,
  create_time?:string,
  payer?:Payer,
  purchase_units?: Purchase_utils[]
}

export interface Payer{
  email_address?:string
}
export interface Purchase_utils{
  amount: Amount;
}
export interface Amount{
  currency_code?: string
  value?:string
}
