import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styles: ``
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  isLoading = false;
  error = '';

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = '';
      const { username, password } = this.loginForm.value;

      this.authService.login(username!, password!).subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.error = 'Invalid credentials';
        }
      });
    }
  }
}
