import { Pipe, PipeTransform } from '@angular/core';
import { normalizeImageUrl } from '../utils/image-url.util';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(imageUrl: string): string {
    return normalizeImageUrl(imageUrl);
  }
}
