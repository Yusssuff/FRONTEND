import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Product } from './products.model';

interface ODataResponse {
  value: {
    Id: number;
    Name: string;
    Price: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = 'http://localhost:5113/odata/Products';

  constructor(private http: HttpClient) {}

  // =========================
  // GET ALL PRODUCTS
  // =========================

  getProducts(
    search?: string,
    sort?: string
  ): Observable<Product[]> {

    let params = new HttpParams();

    // Search
    if (search && search.trim()) {

      const escapedSearch = search
        .trim()
        .replace(/'/g, "''");

      params = params.set(
        '$filter',
        `contains(Name,'${escapedSearch}')`
      );
    }

    // Sorting
    if (sort) {
      params = params.set('$orderby', sort);
    }

    return this.http
      .get<ODataResponse>(
        this.apiUrl,
        { params }
      )
      .pipe(

        map(response => {

          // OData returns { value: [...] }
          return response.value.map(product => ({

            id: product.Id,
            name: product.Name,
            price: product.Price

          }));

        })

      );
  }


  // =========================
  // GET PRODUCT BY ID
  // =========================

  getProduct(id: number): Observable<Product> {

    return this.http
      .get<{
        Id: number;
        Name: string;
        Price: number;
      }>(
        `${this.apiUrl}(${id})`
      )
      .pipe(

        map(product => ({

          id: product.Id,
          name: product.Name,
          price: product.Price

        }))

      );
  }


  // =========================
  // CREATE PRODUCT
  // =========================

  createProduct(
    product: Omit<Product, 'id'>
  ): Observable<Product> {

    return this.http
      .post<{
        Id: number;
        Name: string;
        Price: number;
      }>(
        this.apiUrl,
        {
          Name: product.name,
          Price: product.price
        }
      )
      .pipe(

        map(created => ({

          id: created.Id,
          name: created.Name,
          price: created.Price

        }))

      );
  }


  // =========================
  // UPDATE PRODUCT
  // =========================

  updateProduct(
    product: Product
  ): Observable<Product> {

    return this.http
      .put<{
        Id: number;
        Name: string;
        Price: number;
      }>(
        `${this.apiUrl}(${product.id})`,
        {
          Id: product.id,
          Name: product.name,
          Price: product.price
        }
      )
      .pipe(

        map(updated => ({

          id: updated.Id,
          name: updated.Name,
          price: updated.Price

        }))

      );
  }


  // =========================
  // DELETE PRODUCT
  // =========================

  deleteProduct(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}(${id})`
    );
  }

}
