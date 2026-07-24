// src/app/constants/asset-base.ts

export interface Asset {
  AssetId: string;
  Asset_CityId: string | number;
  CategoryCode: string;
  Bottle_Code: string;
  Content_Code: string;
  Current_Content_Code: string;
  Quantity: number | string;
  remQuantity: number | string;
  Units: string;
  Bottle_loc: string;
  Bottle_Status: string;
  DOM: string | number;
  Max_Refill_Count: number;
  Current_SelfRefill_Count: number;
  Current_PlantRefill_Count: number;
  Latest_Refill_Date: string;
  Retirement_Date: string;
  Retire_Reason: string;
  Content_Price: number | string;
  Bottle_Price: number | string;
  Redeem_Good: number | string;
  Redeem_Damaged: number | string;
  Discount_RefillB: number | string;
  Env_Tax_Customer: number | string;
  Env_Tax_Producer: number | string;
  Env_Tax_Retailer: number | string;
  Discard_fine: number | string;
  Transaction_Id: string;
  Transaction_Date: string;
  Fromfacility: string;
  Tofacility: string;
}


// ✅ Define a base structure to clone dynamically
export const BASE_ASSET: Asset = {
  AssetId: '',
  Asset_CityId: '',
  CategoryCode: 'SB',
  Bottle_Code: '',
  Content_Code: '',
  Current_Content_Code: '',
  Quantity: '500',
  remQuantity: '500',
  Units: 'ml',
  Bottle_loc: '',
  Bottle_Status: 'Full',
  DOM: '0',
  Max_Refill_Count: 5,
  Current_SelfRefill_Count: 0,
  Current_PlantRefill_Count: 0,
  Latest_Refill_Date: '',
  Retirement_Date: '',
  Retire_Reason: '',
  Content_Price: '',
  Bottle_Price: '',
  Redeem_Good: '',
  Redeem_Damaged: '',
  Discount_RefillB: '',
  Env_Tax_Customer: '',
  Env_Tax_Producer: '',
  Env_Tax_Retailer: '',
  Discard_fine: '',
  Transaction_Id: '',
  Transaction_Date: '',
  Fromfacility: '',
  Tofacility: ''
};
