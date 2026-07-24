import { Component, Input } from '@angular/core';
import { LoginserviceService } from '../../services/loginservice.service';
import { ChartOptions, ChartType, ChartDataset, ChartConfiguration, plugins } from 'chart.js';

interface BottleData {
  Bottle_Code: string;
  Bottle_loc: string;
  Quantity: number;
}

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent {
  @Input() filteredData: any;

  public chartData: any;
  public chartOptions: any;
  public chartType: any = 'bar';
  assetdataset: any[] = [];
  counts: { [key: string]: number } = {};
  returncounts: { [key: string]: number } = {};
  aggregatedData: any = {};
  datasets: any = [];
  locationLabels: any[] = [];
  displayLegend = true;
  bottleCodes: any = [];
  seconddisplayLegend = true;
  purchasedData: any[] = [];
  returnedData: any[] = [];
  public barChartLabels: string[] = [
    'B1.V', 'B1.R', 'B2.V', 'B2.R', 'B3.V', 'B3.R',
    'B4.V', 'B4.R', 'B5.V', 'UB.V + B1', 'UB.R + B1',
    'UB.V + B3', 'UB.R + B3', 'UB.V + B4', 'UB.R + B4',
    'UB.V + B5', 'UB.R + B5',
  ];

  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartData: ChartDataset[] = [];
  public barChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      x: {
        stacked: true, // Enable stacking on the x-axis
        title: {
          display: true,
          text: 'Bottle Brand and Package Type', // Y-axis label
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
      y: {
        stacked: true, // Enable stacking on the y-axis
        title: {
          display: true,
          text: 'No. of Shampoo Bottles', // Y-axis label
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Recycling Enthusiasm Across Brands and Package Types',
        font: {
          size: 24,
          weight: 'bold',
        },
      }
    },
  };
  public secondchartOptions = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Bottle Brand and Package Type', // Y-axis label
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
      y: {
        stacked: true, beginAtZero: true,
        title: {
          display: true,
          text: 'No. of Shampoo Bottles', // Y-axis label
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      }
    },
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Asset Track Record',
        font: {
          size: 24,
          weight: 'bold',
        },
      }
    }
  };
  quarterlyChartData!: { label: string; data: number[]; backgroundColor: string; }[];

  constructor(private logser: LoginserviceService) { }

  loadChartData() {
    console.log(this.filteredData);
    this.logser.getFilteredCityAssets(this.filteredData['city'][0]).subscribe((data) => {
      this.assetdataset = [];
      for (let y = 0; y < data.length; y++) {
        this.assetdataset.push(data[y]);
      }
      //console.log(this.assetdataset);

      this.barChartLabels = [
        'B1.V', 'B1.R', 'B2.V', 'B2.R', 'B3.V', 'B3.R',
        'B4.V', 'B4.R', 'B5.V',
        'UB.V + B1', 'UB.R + B1',
        'UB.V + B3', 'UB.R + B3',
        'UB.V + B4', 'UB.R + B4',
        'UB.V + B5', 'UB.R + B5'
      ];

      this.counts = {};
      this.returncounts = {};
      this.barChartLabels.forEach((code) => (this.counts[code] = 0));
      this.barChartLabels.forEach((code) => (this.returncounts[code] = 0));

      for (let r = 0; r < this.assetdataset.length; r++) {
        const record = this.assetdataset[r];
        const bottleCode = record['Bottle_Code'];
        const currentContentCode = record['Content_Code'].split('.')[0];

        if (
          this.barChartLabels.includes(bottleCode) &&
          record['purchased'] === true &&
          !bottleCode.startsWith('UB')
        ) {
          this.counts[bottleCode]++;
        } else if (bottleCode.startsWith('UB.V')) {
          const currentbottlecode = 'UB.V + ' + currentContentCode;
          if (this.barChartLabels.includes(currentbottlecode) && record['purchased'] === true) {
            this.counts[currentbottlecode]++;
          }
        } else if (bottleCode.startsWith('UB.R')) {
          const currentbottlecode = 'UB.R + ' + currentContentCode;
          if (this.barChartLabels.includes(currentbottlecode) && record['purchased'] === true) {
            this.counts[currentbottlecode]++;
          }
        }

        if (
          this.barChartLabels.includes(bottleCode) &&
          (record['Tofacility'] === 'Return Conveyor' || record['Tofacility'] === 'Bottle Reverse Vending Machine' || record['Tofacility'].includes('Plant')) &&
          !bottleCode.startsWith('UB')
        ) {
          this.returncounts[bottleCode]++;
        } else if (bottleCode.startsWith('UB.V')) {
          const currentbottlecode = 'UB.V + ' + currentContentCode;
          if (this.barChartLabels.includes(currentbottlecode) && (record['Tofacility'] === 'Return Conveyor' || record['Tofacility'] === 'Bottle Reverse Vending Machine')) {
            this.returncounts[currentbottlecode]++;
          }
        } else if (bottleCode.startsWith('UB.R')) {
          const currentbottlecode = 'UB.R + ' + currentContentCode;
          if (this.barChartLabels.includes(currentbottlecode) && (record['Tofacility'] === 'Return Conveyor' || record['Tofacility'] === 'Bottle Reverse Vending Machine')) {
            this.returncounts[currentbottlecode]++;
          }
        }
      }

      this.purchasedData = this.barChartLabels.map((label) => this.counts[label] || 0);
      this.returnedData = this.barChartLabels.map((label) => this.returncounts[label] || 0);
      this.barChartData = [
        {
          data: this.purchasedData.map((count, index) => count - this.returnedData[index]),
          label: 'Purchased',
          backgroundColor: '#42A5F5',
        },
        {
          data: this.returnedData,
          label: 'Returned',
          backgroundColor: '#FF7043',
        },
      ];

      this.aggregatedData = this.aggregateBottleCodesByLocation(this.assetdataset);
      this.drawLocationChart();
      this.roleBasedOperations = this.generateRoleBasedObject(this.roles, this.operationTypes);
      //console.log(this.roleBasedOperations);
      this.aggregateBasedonOperations();
      //console.log(this.roleBasedOperations);
    });
    this.logser.getParticularCitytransactions(this.filteredData['city'][0], this.filteredData['role_user'][0]).subscribe((data) => {

      this.prepareQuarterlyChartData(data)


    });
    //;
  }
  roleBasedOperations: any = {};
  drawLocationChart(): void {
    const bottleCodes = Object.keys(this.aggregatedData);
    const allLocations = new Set<string>();
    Object.values(this.aggregatedData).forEach((locationData) => {
      if (typeof locationData === 'object' && locationData !== null) {
        Object.keys(locationData).forEach((loc) => allLocations.add(loc));
      }
    });
    const locationLabels = Array.from(allLocations);

    const datasets = locationLabels.map((location) => {
      return {
        label: location,
        data: bottleCodes.map((bottleCode) => {
          const locationData = this.aggregatedData[bottleCode] as Record<string, number>;
          return locationData[location] || 0;
        }),
        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.9)`,
        // borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.9)`,
        // borderWidth: 0.9,
      };
    });

    this.locationLabels = bottleCodes;
    this.datasets = datasets;
  }

  aggregateBottleCodesByLocation(data: BottleData[]): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};

    data.forEach((item) => {
      const { Bottle_Code, Bottle_loc, Quantity } = item;

      if (!result[Bottle_Code]) {
        result[Bottle_Code] = {};
      }

      if (!result[Bottle_Code][Bottle_loc]) {
        result[Bottle_Code][Bottle_loc] = 0;
      }

      result[Bottle_Code][Bottle_loc]++;
    });

    return result;
  }

  roles = [
    'B1 Shampoo Producer', 'B2 Shampoo Producer', 'B3 Shampoo Producer',
    'B4 Shampoo Producer', 'B5 Shampoo Producer', 'Supermarket Owner', 'Universal Bottle Manufacturing Plant owner',
    'Bottle Reverse Vending Machine Owner', 'Plastic Recycling Plant Owner', 'Shampoo Refilling Station Owner',
    'Universal Bottle Cleaning Plant Owner', 'Rag picker', 'House1 Owner', 'House2 Owner', 'House3 Owner',
    'House4 Owner', 'House5 Owner', 'House6 Owner', 'House7 Owner', 'House8 Owner', 'House9 Owner', 'House10 Owner', 'Mayor'
  ];
  operationTypes = [
    'Purchased', 'Returned', 'ThrownOnTheStreet', 'ThrowOnTheDustbin',
    'ThrownOnTheTruck', 'Using', 'Refilled'
  ];

  generateRoleBasedObject(roles: string[], operationTypes: string[]) {
    const result: { [key: string]: { [key: string]: number } } = {};

    // Loop through each role
    roles.forEach(role => {
      result[role] = {};

      // Loop through each operation type and set initial count to 0
      operationTypes.forEach(operationType => {
        result[role][operationType] = 0;
      });
    });

    return result;
  }

  aggregateBasedonOperations() {

    this.assetdataset.forEach((operation) => {
      //console.log(operation);
      const { Fromfacility, Tofacility, Bottle_Status } = operation;
      //console.log(Fromfacility, Tofacility);

      if (Bottle_Status == 'InUse') {
        this.incrementCategory(this.roleBasedOperations[Tofacility], 'Using');
      }
      if (Fromfacility === 'Supermarket Owner' && this.isValidToFacility(Tofacility)) {
        this.incrementCategory(this.roleBasedOperations[Tofacility], 'Purchased');
      } else if (
        (Fromfacility.includes("Owner") || Fromfacility === 'Mayor') &&
        (Tofacility === 'Bottle Reverse Vending Machine' || Tofacility === 'Return Conveyor' || Tofacility === 'Reverse Vending' || Tofacility === 'ReturnConveyor')
      ) {
        this.incrementCategory(this.roleBasedOperations[Fromfacility], 'Returned');
      } else if (Fromfacility.includes('Refilling Station') && this.isValidToFacility(Tofacility)) {
        this.incrementCategory(this.roleBasedOperations[Tofacility], 'Refilled');
      }
      else if (this.isValidToFacility(Fromfacility) && (Tofacility === 'Street')) {
        this.incrementCategory(this.roleBasedOperations[Fromfacility], 'ThrownOnTheStreet');
      }
      else if (this.isValidToFacility(Fromfacility) && (Tofacility === 'Garbage Truck')) {
        this.incrementCategory(this.roleBasedOperations[Fromfacility], 'ThrownOnTheTruck');
      }
      else if (this.isValidToFacility(Fromfacility) && (Tofacility === 'City Dustbin')) {
        this.incrementCategory(this.roleBasedOperations[Fromfacility], 'ThrowOnTheDustbin');
      }
      // else if (this.isValidToFacility(Fromfacility) && (Tofacility === 'City Dustbin')) {
      //   this.incrementCategory(this.roleBasedOperations[Fromfacility], 'ThrowOnTheDustbin');
      // }
    });


    this.oprlabel = Object.keys(this.roleBasedOperations);

    // Extract datasets (values of the object grouped by property)
    const properties = Object.keys(this.roleBasedOperations[this.oprlabel[0]]);
    this.oprChartdata = properties.map((property) => ({
      label: property.replace(/([A-Z])/g, ' $1').trim(), // Add spaces to camelCase keys
      data: this.oprlabel.map((label: string | number) => this.roleBasedOperations[label][property]),
      backgroundColor: this.getBackgroundColor(property),
    }));



    this.chartOptions = {
      responsive: true,
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Consumer Roles', // Y-axis label
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: 'No. of Shampoo Bottles', // Y-axis label
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },

      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        title: {
          display: true,
          text: 'Consumer Civic Sense Index',
          font: {
            size: 24,
            weight: 'bold',
          },
        }
      },
    };
  }

  oprChartdata: any;
  oprlabel: any;
  private incrementCategory(category: any, operationType: string) {
    //console.log(category, operationType)
    if (category.hasOwnProperty(operationType)) {
      category[operationType]++;
    }
  }
  private isValidToFacility(toFacility: string): boolean {
    return this.roles.includes(toFacility);
  }


  // Helper to assign colors dynamically
  getBackgroundColor(property: string): string {
    const colors: { [key: string]: string } = {
      Purchased: 'rgba(54, 162, 235, 0.6)',
      Returned: 'rgba(255, 99, 132, 0.6)',
      ThrownOnTheStreet: 'rgba(255, 159, 64, 0.6)',
      ThrownOnTheDustbin: 'rgba(75, 192, 192, 0.6)',
      ThrownOnTheTruck: 'rgba(153, 102, 255, 0.6)',
      Using: 'rgba(255, 206, 86, 0.6)',
      Refilled: 'rgba(75, 192, 75, 0.6)',
    };
    return colors[property] || 'rgba(0, 0, 0, 0.6)';
  }



  public prepareQuarterlyChartData(transactions: any[]): void {
    // Process the data into quarters
    const quarters = this.processQuarterlyData(transactions);

    this.quarterbarChartData = [
      {
        data: [quarters.Q1.container, quarters.Q2.container, quarters.Q3.container, quarters.Q4.container],
        label: 'Container Amount',
        backgroundColor: 'rgba(238, 23, 70, 0.7)'
      },
      {
        data: [quarters.Q1.content, quarters.Q2.content, quarters.Q3.content, quarters.Q4.content],
        label: 'Content Amount',
        backgroundColor: 'rgba(54, 162, 235, 0.7)'
      },
      {
        data: [quarters.Q1.refill, quarters.Q2.refill, quarters.Q3.refill, quarters.Q4.refill],
        label: 'Refill Amount',
        backgroundColor: 'rgba(255, 206, 86, 0.7)'
      },
      {
        data: [-(quarters.Q1.return), -(quarters.Q2.return), -(quarters.Q3.return), -(quarters.Q4.return)],
        label: 'Return Amount',
        backgroundColor: 'rgba(255, 87, 34, 0.7)'
      },
      {
        data: [quarters.Q1.tax, quarters.Q2.tax, quarters.Q3.tax, quarters.Q4.tax],
        label: 'Environment Tax',
        backgroundColor: 'rgba(153, 102, 255, 0.7)'

      },
      {
        data: [quarters.Q1.fine, quarters.Q2.fine, quarters.Q3.fine, quarters.Q4.fine],
        label: 'Fine Amount',
        backgroundColor: 'rgba(53, 253, 53, 0.7)'
      }
    ];
    console.log(this.quarterbarChartData);

  }

  // 2. Modify your existing processQuarterlyData method to return the correct type:
  private processQuarterlyData(transactions: any[]) {
    // Group by quarter and calculate amounts
    const quarters = {
      Q1: { container: 0, content: 0, refill: 0, return: 0, tax: 0, fine: 0 },
      Q2: { container: 0, content: 0, refill: 0, return: 0, tax: 0, fine: 0 },
      Q3: { container: 0, content: 0, refill: 0, return: 0, tax: 0, fine: 0 },
      Q4: { container: 0, content: 0, refill: 0, return: 0, tax: 0, fine: 0 }
    };
    console.log(transactions)
    transactions.forEach(tx => {

      const day = parseInt(tx.TransactionId.split("_")[1]);
      let quarter: keyof typeof quarters;
      console.log(day)
      // Determine quarter (assuming 365 days divided into 4 quarters)
      if (day <= 91) quarter = 'Q1';
      else if (day <= 182) quarter = 'Q2';
      else if (day <= 273) quarter = 'Q3';
      else quarter = 'Q4';

      // Categorize the transaction
      if (tx.Purpose.includes('returning Bottle') && tx.CreditFacility == this.filteredData['role_user'][0]) {
        quarters[quarter].return += parseFloat(tx.Amount); // Ensure 'quarter' is typed correctly
      }
      else if (tx.Purpose.includes('Environment tax') && tx.DebitFacility == this.filteredData['role_user'][0]) {
        quarters[quarter].tax += parseFloat(tx.Amount);
      }
      else if (tx.Purpose.includes('Refilling shampoo') && tx.DebitFacility == this.filteredData['role_user'][0]) {
        quarters[quarter].refill += parseFloat(tx.Amount);
      }
      else if (tx.Purpose.includes('Throwing Bottle') && tx.DebitFacility == this.filteredData['role_user'][0]) {
        quarters[quarter].fine += parseFloat(tx.Amount);
      }

      // Container and content amounts
      quarters[quarter].container += parseFloat(tx.Container_Amt);
      quarters[quarter].content += parseFloat(tx.Content_Amt);
    });

    return quarters;

    // Categorize the transaction


  }

  public quarterbarChartLegend = true;
  public quarterbarChartPlugins = [];
  public quarterbarChartData: ChartDataset[] = [];
  public quarterbarChartOptions: ChartOptions = {

    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Quarters', // X-axis label
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        ticks: {
          autoSkip: false, // Show all labels
        },
        labels: ['Q1', 'Q2', 'Q3', 'Q4'], // Move labels here
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Consumer\'s Spend on Quarters',
        font: {
          size: 24,
          weight: 'bold',
        },
      }
    },



  };



}
