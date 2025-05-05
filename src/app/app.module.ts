import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    // ...other imports
  ],
})
export class AppModule {}
