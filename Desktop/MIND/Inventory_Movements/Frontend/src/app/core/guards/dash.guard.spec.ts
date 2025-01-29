import { TestBed } from '@angular/core/testing';

import { DashGuard } from './dash.guard';

describe('DashGuard', () => {
  let guard: DashGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(DashGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
