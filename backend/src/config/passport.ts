import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../models/User';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ username });
        if (!user) {
          return done(null, false, { message: 'Incorrect username or password' });
        }

        // Use passport-local-mongoose's authenticate method
        return (user as any).authenticate(password, (err: Error | null, user: any, error: any) => {
          if (err) return done(err);
          if (!user) return done(null, false, error || { message: 'Incorrect username or password' });
          return done(null, user);
        });
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

