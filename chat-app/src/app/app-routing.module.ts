import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { GroupComponent } from './group/group.component';
import { ChannelComponent } from './channel/channel.component';

const routes: Routes = [
  {
    path: '', component:LoginComponent
  },
  {
    path: 'dashboard', component:DashboardComponent
  },
  {
    path: 'group', component:GroupComponent
  },
  {
    path: 'channel', component:ChannelComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
