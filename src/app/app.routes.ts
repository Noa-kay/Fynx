import { Routes } from '@angular/router';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FeedComponent } from './components/feed/feed.component';
import { ChatBotComponent } from './components/chat/chatbot.component';
import { CategoriesComponent } from './pages/categories.component';
import { CategoryPostsComponent } from './pages/category-posts.component';
import { HomeComponent } from './pages/home.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'sign-up', component: SignUpComponent },
    { path: 'sign-in', component: SignInComponent },
    { path: 'feed', component: FeedComponent },
    { path: 'categories', component: CategoriesComponent },
    { path: 'categories/:id', component: CategoryPostsComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'chat', component: ChatBotComponent },
    { path: '**', redirectTo: '/sign-in' },
];