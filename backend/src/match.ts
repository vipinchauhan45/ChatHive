import { User } from "./models/user.js";

export function calculateMatch(user1: User, user2: User): number{
    let score = 1.0;
    if(!user1.continent || !user2.continent) score -= 0.1;
    else if(user1.continent != user2.continent){
        return Math.max(0, score);
    }
    else score -= 0.4;

    if(!user1.country || !user2.country) score -= 0.1;
    else if(user1.country != user2.country){
        return Math.max(0, score);
    }
    else score -= 0.2;

    if(!user1.state || !user2.state) score -= 0.1;
    else if(user1.state != user2.state){
        return Math.max(0, score);
    }
    else score -= 0.2;

    if(!user1.local || !user2.local) score -= 0.1;
    else if(user1.local != user2.local){
        return Math.max(0, score);
    }
    else score -= 0.2;

    return Math.max(0, score);
}