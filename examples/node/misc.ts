//

document
  .querySelector("button")
  .addEventListener("click", event => {
    console.log(event);
  });

//

<progress [value]="notion.kinesis("slider")" />
  
</button>

<button (click)="">

</button>

//

import { Notion } from "@neurosity/notion";

const notion = new Notion({
  deviceId: "DEVICE_ID",
  apiKey: "DEVICE_API_KEY"
});

//

notion
  .kinesis("goLeft", "goRight")
  .subscribe(({ label, confidence }) => {
    console.log(label, confidence); // "goLeft", 0.93
  });

//

notion
  .emotion("anger")
  .subscribe(({ confidence }) => {
    if (confidence > 90) {
      alert("Don't send that email!");
    }
  });

//

notion
  .awareness("drowsiness")
  .subscribe(({ confidence }) => {
    if (confidence > 95) {
      tesla.pullOver();
    }
  });

//

import { Component } from "@angular/core";

@Component({
  selector: "app",
  templateUrl: "./app.component.html"
})
export class App extends Component {}

//

import { Component } from "@angular/core";
import { Notion } from "@neurosity/notion";

@Component({
  selector: "app",
  templateUrl: "./app.component.html"
})
export class App extends Component {
  notion = new Notion({
    deviceId: "DEVICE_ID",
    apiKey: "DEVICE_API_KEY"
  });
}

//

this.mind.kinesis("goLeft", "goRight");

//

import { Component } from "@angular/core";
import { MindSerice } from "@neurosity/angular";

export class App extends Component {
  constructor(private mindService: MindService) {}
}
