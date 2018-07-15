import Locationlist from './constants/locations'
import { getRandomInt } from './utils'
const getRandomLocationAndRole = () => {
  let randInt = getRandomInt(Locationlist.length)
  return Locationlist[randInt]
}
const getRandomRole = roles => {
  let randInt = getRandomInt(roles.length)
  return roles[randInt]
}
let locationAndRole = getRandomLocationAndRole()
console.log(locationAndRole.Location)
console.log(locationAndRole.Roles)
