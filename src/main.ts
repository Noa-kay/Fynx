import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { LoadingPageComponent } from './app/components/loading-page/loading-page.component';
import { routes as appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
    providers: [
        provideRouter(appRoutes), 
        provideHttpClient(withFetch()),
    ]
});