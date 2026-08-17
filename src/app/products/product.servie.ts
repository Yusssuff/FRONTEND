import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import { Observable, map } from 'rxjs';

import { Product } from './products.model';

interface ODataResponse {
  value: ODataProduct[];
}

interface ODataProduct {
  Id: number;
  Name: string;
  Price: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {

  private readonly apiUrl =
    'http://localhost:5113/odata/Products';

  constructor(
    private http: HttpClient,
  ) {}

  // =========================================================
  // GET PRODUCTS
  // =========================================================

  getProducts(
    search?: string,
  ): Observable<Product[]> {

    let params = new HttpParams();

    if (search && search.trim()) {

      const escapedSearch =
        search.trim().replace(/'/g, "''");

      params = params.set(
        '$filter',
        `contains(Name,'${escapedSearch}')`,
      );
    }

    return this.http
      .get<ODataResponse>(
        this.apiUrl,
        {
          params,
        },
      )
      .pipe(

        map((response) => {

          if (
            !response ||
            !Array.isArray(response.value)
          ) {
            return [];
          }

          return response.value.map(
            (product) => ({
              id: Number(product.Id),
              name: product.Name,
              price: Number(product.Price),
            }),
          );
        }),
      );
  }

  // =========================================================
  // GET PRODUCT BY ID
  // =========================================================

  getProduct(
    id: number,
  ): Observable<Product> {

    return this.http
      .get<ODataProduct>(
        `${this.apiUrl}(${id})`,
      )
      .pipe(

        map((product) => ({
          id: Number(product.Id),
          name: product.Name,
          price: Number(product.Price),
        })),
      );
  }

  // =========================================================
  // CREATE
  // =========================================================

  createProduct(
    product: Omit<Product, 'id'>,
  ): Observable<Product> {

    return this.http
      .post<ODataProduct>(
        this.apiUrl,
        {
          Name: product.name,
          Price: product.price,
        },
      )
      .pipe(

        map((created) => ({
          id: Number(created.Id),
          name: created.Name,
          price: Number(created.Price),
        })),
      );
  }

  // =========================================================
  // UPDATE
  // =========================================================

  updateProduct(
    product: Product,
  ): Observable<Product> {

    return this.http
      .put<ODataProduct>(
        `${this.apiUrl}(${product.id})`,
        {
          Id: product.id,
          Name: product.name,
          Price: product.price,
        },
      )
      .pipe(

        map((updated) => ({
          id: Number(updated.Id),
          name: updated.Name,
          price: Number(updated.Price),
        })),
      );
  }

  // =========================================================
  // DELETE
  // =========================================================

  deleteProduct(
    id: number,
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}(${id})`,
    );
  }
}
