import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { ApiService } from '../service/api.service';
import { UserDTO } from '../service/models/auth.model';


interface Category {
  categoryId: number;
  categoryName: string; 
  description: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];

  showCreateModal = signal<boolean>(false);
  newCategoryTitle: string = '';
  newCategoryDesc: string = '';

  showEditModal = signal<boolean>(false);
  editCategoryId: number | null = null;
  editCategoryTitle: string = '';
  editCategoryDesc: string = '';
  
  showDeleteModal = signal<boolean>(false);
  pendingDeleteCategoryId: number | null = null;
  

  private router = inject(Router);
  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  
  isAvatarMenuOpen = signal<boolean>(false); 

  ngOnInit(): void {
    this.loadCategories();
  }
  
    user() {
      return this.authService.getCurrentUserData();
    }


  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (data: Category[]) => {
        console.log('Categories data received:', data);
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  open(c: Category) {
    this.router.navigate(['/categories', c.categoryId]);
  }

  toggleAvatarMenu(): void {
    this.isAvatarMenuOpen.update(value => !value);
  }

  navigateToProfile(): void {
    this.isAvatarMenuOpen.set(false);
    this.router.navigate(['/profile']);
  }

  openCreateModal(): void {
    this.newCategoryTitle = '';
    this.newCategoryDesc = '';
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createCategory(): void {
    const title = this.newCategoryTitle?.trim();
    if (!title) return;
    const payload = {
      categoryName: title,
      description: this.newCategoryDesc?.trim() || ''
    };
    
    this.apiService.createCategory(payload).subscribe({
      next: (newCategory: Category) => {
        this.categories.push(newCategory);
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating category:', err);
      }
    });
  }

  openEditModal(category: Category, event: Event): void {
    event.stopPropagation();
    this.editCategoryId = category.categoryId;
    this.editCategoryTitle = category.categoryName; 
    this.editCategoryDesc = category.description;
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editCategoryId = null;
    this.editCategoryTitle = '';
    this.editCategoryDesc = '';
  }

  saveEditCategory(): void {
    const title = this.editCategoryTitle?.trim();
    if (!title || this.editCategoryId === null) return;
    const apiPayload = {
      categoryName: title,
      description: this.editCategoryDesc?.trim() || ''
    };

    this.apiService.updateCategory(this.editCategoryId, apiPayload).subscribe({
      next: (updatedCategory: Category) => {
        const category = this.categories.find(c => c.categoryId === this.editCategoryId);
        if (category) {
          category.categoryName = updatedCategory.categoryName || title;
          category.description = updatedCategory.description;
        }
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error updating category:', err);
      }
    });
  }

  requestDeleteCategory(categoryId: number, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteCategoryId = categoryId;
    this.showDeleteModal.set(true);
  }

  cancelDeleteCategory(): void {
    this.showDeleteModal.set(false);
    this.pendingDeleteCategoryId = null;
  }

  confirmDeleteCategory(): void {
    if (this.pendingDeleteCategoryId == null) return;
    const categoryId = this.pendingDeleteCategoryId;
    this.apiService.deleteCategory(categoryId).subscribe({
      next: () => {
        const index = this.categories.findIndex(c => c.categoryId === categoryId);
        if (index > -1) {
          this.categories.splice(index, 1);
        }
        this.cancelDeleteCategory();
      },
      error: (err) => {
        console.error('Error deleting category:', err);
      }
    });
  }

  signOut(): void {
    console.log('User signed out');
    this.authService.logout();
    this.isAvatarMenuOpen.set(false);
    this.router.navigate(['/sign-in']);
  }
}