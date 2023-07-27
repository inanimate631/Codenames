import { Injectable } from '@angular/core';
import { User } from '../../interface/User.interface';
import { Store } from '@ngrx/store';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as PostsActions from '../../state/actions';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: User | null = null;
  isEditing = false;
  usersArray!: User[];

  constructor(
    private store: Store,
    private http: HttpClient,
    private socket: Socket
  ) {}

  initialize(): void {
    this.socket.on('currentUser', (user: User) => {
      this.user = user;
      this.store.dispatch(
        PostsActions.connectUser({
          user: user,
        })
      );
    });

    this.socket.on('connectedUsersUpdated', (users: User[]) => {
      this.usersArray = users;
      this.usersArray = this.usersArray.filter(
        (user) => user.id !== (this.user as User).id
      );
      this.store.dispatch(
        PostsActions.connectUsers({
          users: this.usersArray,
        })
      );
    });
  }

  changeColor() {
    function random(max: number) {
      return Math.floor(Math.random() * max);
    }
    const updatedObject = {
      ...(this.user as User),
      color: `rgb(${random(256)}, ${random(256)}, ${random(256)})`,
    };
    return this.updateUser(updatedObject);
  }

  startEditing() {
    this.isEditing = true;
  }

  stopEditing(name: string) {
    if ((this.user as User).name !== name) {
      this.isEditing = false;
      const updatedObject = {
        ...(this.user as User),
        name: name,
      };
      this.updateUser(updatedObject);
    }
  }

  changeUserRole(newRole: string, isMaster: boolean) {
    const updatedObject = {
      ...(this.user as User),
      role: newRole,
      isMaster: isMaster,
    };
    this.updateUser(updatedObject);
  }

  updateUser(newUser: User) {
    this.store.dispatch(
      PostsActions.connectUser({
        user: newUser,
      })
    );
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const updateUsers = [...this.usersArray];
    updateUsers.push(newUser);
    const url = 'http://localhost:5000/updateConnectedUsers';
    this.http.post(url, updateUsers, { headers }).subscribe(
      () => {},
      (error) => {
        console.error('Error:', error);
      }
    );
    this.user = newUser;
  }
}
