import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ShopService } from '../../core/services/shop.service';
import { trigger, transition, style, animate} from '@angular/animations';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ContactComponent } from "../contact/contact.component";
import { ViewportScroller } from '@angular/common';
import { MatDivider } from "@angular/material/divider";
import { ViewStateService } from '../../core/services/view-state.service';

@Component({
  selector: 'app-home',
  imports: [MatIconModule, RouterModule, ContactComponent, MatDivider],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [
    trigger('swipeBanner', [
      transition(':increment', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':decrement', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('500ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class HomeComponent {
  shopService = inject(ShopService);
  offerBanners = [
    {
      image: '/images/banner-offer1.png',
      type: 'Dumbbells'
    },
    {
      image: '/images/banner-offer2.png',
      type: 'Treadmills'
    }
  ];

  contactInView = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    private viewState: ViewStateService
  ) {
    this.router.events.subscribe(event => {
      // Only scroll after navigation ends
      if (event instanceof NavigationEnd) {
        const fragment = this.route.snapshot.fragment;
        if (fragment) {
          setTimeout(() => {
            const el = document.getElementById(fragment);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              this.viewportScroller.scrollToAnchor(fragment);
            }
          }, 0);
        }
      }
    });
  }

  ngAfterViewInit() {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          this.contactInView = entry.isIntersecting;
          this.viewState.setContactInView(entry.isIntersecting);
        },
        { threshold: 0.5 }
      );
      observer.observe(contactSection);
    }
  }
}
