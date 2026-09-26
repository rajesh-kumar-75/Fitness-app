import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NutritionService } from '../../../core/services/nutrition.service';
import { GroceryCategory, GroceryItem, GroceryListResponse } from '../../../core/models/nutrition.model';

@Component({
  selector: 'app-meal-prep-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './meal-prep-checklist.component.html',
  styleUrl: './meal-prep-checklist.component.scss',
})
export class MealPrepChecklistComponent implements OnInit {
  private readonly nutritionService = inject(NutritionService);
  private readonly router = inject(Router);

  readonly categories: GroceryCategory[] = ['Proteins', 'Produce', 'Pantry/Grains', 'Dairy', 'Other'];

  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly selectedCategoryFilter = signal<'All' | GroceryCategory>('All');
  readonly currentFilterTab = signal<'all' | 'pending' | 'completed'>('all');

  // Add Custom Item Form state
  readonly customName = signal<string>('');
  readonly customCategory = signal<GroceryCategory>('Produce');
  readonly customQuantity = signal<number>(1);
  readonly customUnit = signal<string>('units');
  readonly showAddModal = signal<boolean>(false);

  readonly listData = signal<GroceryListResponse['data'] | null>(null);

  readonly allItems = computed<GroceryItem[]>(() => {
    return this.listData()?.items || [];
  });

  readonly totalItemsCount = computed<number>(() => {
    return this.allItems().length;
  });

  readonly completedCount = computed<number>(() => {
    return this.allItems().filter((i) => i.isChecked).length;
  });

  readonly progressPercentage = computed<number>(() => {
    const total = this.totalItemsCount();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  readonly filteredItems = computed<GroceryItem[]>(() => {
    let items = this.allItems();

    // Category filter
    const cat = this.selectedCategoryFilter();
    if (cat !== 'All') {
      items = items.filter((i) => i.category === cat);
    }

    // Status tab filter
    const tab = this.currentFilterTab();
    if (tab === 'pending') {
      items = items.filter((i) => !i.isChecked);
    } else if (tab === 'completed') {
      items = items.filter((i) => i.isChecked);
    }

    return items;
  });

  readonly groupedDisplay = computed<Record<GroceryCategory, GroceryItem[]>>(() => {
    const items = this.filteredItems();
    const map: Record<GroceryCategory, GroceryItem[]> = {
      Proteins: [],
      Produce: [],
      'Pantry/Grains': [],
      Dairy: [],
      Other: [],
    };

    items.forEach((item) => {
      if (map[item.category]) {
        map[item.category].push(item);
      } else {
        map.Other.push(item);
      }
    });

    return map;
  });

  ngOnInit(): void {
    this.loadChecklist();
  }

  loadChecklist(): void {
    this.isLoading.set(true);
    this.nutritionService.getGroceryList().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listData.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load grocery list:', err);
        this.isLoading.set(false);
      },
    });
  }

  toggleItem(item: GroceryItem): void {
    const current = this.listData();
    if (!current) return;

    const updatedItems = current.items.map((i) => {
      if (i.id === item.id) {
        return { ...i, isChecked: !i.isChecked };
      }
      return i;
    });

    // Optimistic UI update
    this.listData.set({
      ...current,
      items: updatedItems,
    });

    this.syncWithBackend(updatedItems);
  }

  addCustomItem(): void {
    const name = this.customName().trim();
    if (!name) return;

    const current = this.listData();
    const newItem: GroceryItem = {
      id: `custom-${Date.now()}`,
      name,
      category: this.customCategory(),
      quantity: Number(this.customQuantity()) || 1,
      unit: this.customUnit().trim() || 'units',
      isChecked: false,
      isCustom: true,
    };

    const updatedItems = [newItem, ...(current?.items || [])];

    if (current) {
      this.listData.set({
        ...current,
        items: updatedItems,
      });
    }

    // Reset input
    this.customName.set('');
    this.customQuantity.set(1);
    this.showAddModal.set(false);

    this.syncWithBackend(updatedItems);
  }

  removeItem(itemId: string, event: Event): void {
    event.stopPropagation();
    const current = this.listData();
    if (!current) return;

    const updatedItems = current.items.filter((i) => i.id !== itemId);
    this.listData.set({
      ...current,
      items: updatedItems,
    });

    this.syncWithBackend(updatedItems);
  }

  resetAllChecked(): void {
    const current = this.listData();
    if (!current) return;

    if (!confirm('Uncheck all items in this grocery list?')) return;

    const updatedItems = current.items.map((i) => ({ ...i, isChecked: false }));
    this.listData.set({
      ...current,
      items: updatedItems,
    });

    this.syncWithBackend(updatedItems);
  }

  goBack(): void {
    this.router.navigate(['/nutrition']);
  }

  private syncWithBackend(items: GroceryItem[]): void {
    this.isSaving.set(true);
    const week = this.listData()?.weekStartDate;

    this.nutritionService.updateGroceryList(items, week).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listData.set(res.data);
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Failed to sync grocery list with backend:', err);
        this.isSaving.set(false);
      },
    });
  }
}
