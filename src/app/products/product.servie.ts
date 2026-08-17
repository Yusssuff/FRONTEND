import {
  Injectable
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

import {
  Product
} from './products.model';

interface ODataProduct {

  Id: number;

  Name: string;

  Price: number;

}

interface ODataResponse {

  value: ODataProduct[];

}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl =
    'http://localhost:5113/odata/Products';

  constructor(
    private http: HttpClient
  ) {}

  // =========================================================
  // GET PRODUCTS
  // =========================================================

  getProducts(
    searchTerm: string = ''
  ): Observable<Product[]> {

    let params =
      new HttpParams();

    const search =
      searchTerm.trim();

    if (search) {

      params =
        params.set(
          '$filter',
          `contains(Name,'${search.replace(/'/g, "''")}')`
        );

    }

    return this.http
      .get<ODataResponse>(
        this.apiUrl,
        {
          params
        }
      )
      .pipe(

        map(
          (
            response: ODataResponse
          ) => {

            if (
              !response ||
              !Array.isArray(
                response.value
              )
            ) {

              return [];

            }

            return response.value.map(
              (
                item: ODataProduct
              ): Product => ({

                id: item.Id,

                name: item.Name,

                price: item.Price

              })
            );

          }
        )

      );

  }

  // =========================================================
  // CREATE PRODUCT
  // =========================================================

  createProduct(
    product: {
      name: string;
      price: number;
    }
  ): Observable<Product> {

    return this.http
      .post<any>(
        this.apiUrl,
        {
          Name: product.name,
          Price: product.price
        }
      )
      .pipe(

        map(
          (item: any): Product => ({

            id: item.Id,

            name: item.Name,

            price: item.Price

          })
        )

      );

  }

  // =========================================================
  // UPDATE PRODUCT
  // =========================================================

  updateProduct(
    product: Product
  ): Observable<Product> {

    const url =
      `${this.apiUrl}(${product.id})`;

    return this.http
      .put<any>(
        url,
        {
          Name: product.name,
          Price: product.price
        }
      )
      .pipe(

        map(
          (item: any): Product => ({

            id:
              item?.Id ??
              product.id,

            name:
              item?.Name ??
              product.name,

            price:
              item?.Price ??
              product.price

          })
        )

      );

  }

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  deleteProduct(
    id: number
  ): Observable<void> {

    const url =
      `${this.apiUrl}(${id})`;

    return this.http.delete<void>(
      url
    );

  }

}
